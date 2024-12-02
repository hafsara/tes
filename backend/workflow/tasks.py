from datetime import datetime

from celery import shared_task
from backend.api.models import FormContainer, TimelineEntry, Workflow
from backend.email_manager import send_email
from backend.extensions import db

MAX_REMINDERS = 3
REMINDER_INTERVAL = 86400


def create_workflow(form_id, celery_task_id, workflow_type):
    """
    Creates a new workflow for a given form.
    """
    workflow = Workflow(
        form_id=form_id,
        celery_task_id=celery_task_id,
        workflow_type=workflow_type,
        status="pending",
    )
    db.session.add(workflow)
    db.session.commit()
    return workflow


def cancel_workflow(form_id, workflow_type=None):
    """
    Cancel workflow linked to a form.
    """
    query = Workflow.query.filter_by(form_id=form_id, status="pending")
    if workflow_type:
        query = query.filter_by(workflow_type=workflow_type)

    workflows = query.all()
    if not workflows:
        print(f"No active workflow found for the form {form_id}.")
        return

    for workflow in workflows:
        if workflow.celery_task_id:
            from celery import current_app
            current_app.control.revoke(workflow.celery_task_id, terminate=True)
            print(f"Tâche {workflow.celery_task_id} annulée.")

        workflow.status = "canceled"
        db.session.commit()
    print(f"Toutes les tâches liées au formulaire {form_id} ont été annulées.")


@shared_task
def send_reminder_task(container_id, reminder_count=1):
    """Send a reminder and schedule the next reminder if limit is not reached."""

    form_container = FormContainer.query.get(container_id)
    if not form_container:
        return "FormContainer not found"

    latest_form = form_container.forms[-1] if form_container.forms else None
    if latest_form and latest_form.status == 'open':
        # Send the reminder email
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
        form_container.last_reminder_sent = datetime.utcnow()
        form_container.reminder_count += 1
        db.session.commit()

        # Check if we've reached the maximum number of reminders
        if reminder_count < MAX_REMINDERS:
            send_reminder_task.apply_async((container_id, reminder_count + 1), countdown=REMINDER_INTERVAL)
        else:
            if form_container.escalate:
                escalate_task.apply_async((container_id,), countdown=REMINDER_INTERVAL)
        return f"Reminder {reminder_count} sent"

    return "No reminder needed - form is no longer open"


@shared_task
def escalate_task(container_id):
    """Send an escalation email if the form is still incomplete."""
    form_container = FormContainer.query.get(container_id)
    if not form_container:
        return "FormContainer not found"

    latest_form = form_container.forms[-1] if form_container.forms else None
    if latest_form and latest_form.status == 'open':
        # Send escalation email to the manager
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

    return "No escalation needed - form is no longer open"


def run_delayed_workflow(container_id):
    """Start the reminder and escalation workflow."""
    form_container = FormContainer.query.get(container_id)
    if not form_container:
        print("FormContainer not found")
        return

    # Start with the first reminder
    send_reminder_task.apply_async((container_id, 1), countdown=REMINDER_INTERVAL)


def send_initial_notification_task(container_id):
    form_container = FormContainer.query.get(container_id)
    if form_container:
        send_email(
            to=form_container.user_email,
            subject="New Form Notification",
            body=f"A new form has been created with the title: {form_container.title}.",
            link=form_container.access_token
        )
