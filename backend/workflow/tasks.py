from datetime import datetime
from backend.api.models import FormContainer, TimelineEntry
from backend.email_manager import send_email
from backend.extensions import db
from celery import shared_task, chain, chord

MAX_REMINDERS = 3
REMINDER_INTERVAL = 86400  # 1 day in seconds

class WorkflowManager:
    """
    A class to handle form related workflows.
    """

    @staticmethod
    def _send_initial_notification_task(container_id):
        form_container = FormContainer.query.get(container_id)
        if form_container:
            send_email(
                to=form_container.user_email,
                subject="New Form Notification",
                body=f"A new form has been created with the title: {form_container.title}.",
                link=form_container.access_token
            )

    @classmethod
    def start_workflow(cls, form_id):
        """
        Starts a workflow (reminders followed by escalation).
        """
        tasks = [
            send_reminder_task.s(form_id, i).set(countdown=i * REMINDER_INTERVAL)
            for i in range(1, MAX_REMINDERS + 1)
        ]
        tasks.append(escalate_task.s(form_id).set(countdown=(MAX_REMINDERS + 1) * REMINDER_INTERVAL))

        # Create and run the chain
        chain(*tasks).apply_async()
        cls._send_initial_notification_task(form_id)

    @staticmethod
    def stop_workflow(form_id):
        """
        Stop a workflow by updating its status.
        """
        form_container = FormContainer.query.get(form_id)
        if form_container:
            form_container.status = 'stopped'
            db.session.commit()

@shared_task(bind=True)
def send_reminder_task(self, container_id, reminder_count):
    """
    Task to send a reminder.
    """
    form_container = FormContainer.query.get(container_id)
    if not form_container:
        return "FormContainer introuvable."

    if form_container.status == 'stopped':
        self.request.chain = None  # Break the chain if the workflow is stopped
        return "Workflow stopped."

    latest_form = form_container.forms[-1] if form_container.forms else None
    if latest_form and latest_form.status == 'open':
        send_email(
            to=form_container.user_email,
            subject="Reminder: Please respond to the form",
            body=f"Please respond to the form {form_container.title}."
        )
        timeline_entry = TimelineEntry(
            form_container_id=container_id,
            event=f"Reminder {reminder_count} sent",
            timestamp=datetime.utcnow(),
            details=f"Reminder {reminder_count} sent to user {form_container.user_email}"
        )
        db.session.add(timeline_entry)
        db.session.commit()
        return f"Reminder {reminder_count} sent"

    return "No reminder needed - form is no longer open."

@shared_task(bind=True)
def escalate_task(self, container_id):
    """
    Task to send an escalation email.
    """
    form_container = FormContainer.query.get(container_id)
    if not form_container:
        return "FormContainer introuvable."

    if form_container.status == 'stopped':
        self.request.chain = None  # Break the chain if the workflow is stopped
        return "Workflow stopped."

    latest_form = form_container.forms[-1] if form_container.forms else None
    if latest_form and latest_form.status == 'open':
        send_email(
            to=form_container.escalade_email,
            subject="Escalation: User has not responded to the form",
            body=f"The user has not responded to the form {form_container.title}."
        )
        timeline_entry = TimelineEntry(
            form_container_id=container_id,
            event="Escalation sent",
            timestamp=datetime.utcnow(),
            details=f"Escalation sent to manager {form_container.escalade_email}"
        )
        db.session.add(timeline_entry)

        form_container.escalated = True
        db.session.commit()
        return "Escalation sent"

    return "No escalation needed - form is no longer open."