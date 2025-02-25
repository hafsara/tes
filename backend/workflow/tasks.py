import logging
from celery import chain
from datetime import datetime
from api.models import Form, FormContainer, TimelineEntry
from api.extensions import db
from .email_manager import MailManager
from .celery_app import celery as app

logger = logging.getLogger(__name__)

MAX_REMINDERS = 3
DAY_SEC = 86400


class WorkflowManager:
    def __init__(self, form_container):
        self.mail_sender = form_container.application.mail_sender
        self.user_email = form_container.user_email
        self.cc_emails = form_container.cc_emails if form_container.cc_emails is not None else []
        self.access_token = form_container.access_token
        self.reminder_delay = form_container.reminder_delay
        self.escalate = form_container.escalate
        self.container_id = form_container.id
        self.tasks = []

    def start_workflow(self, form_id):
        logger.info(f"Starting workflow for form {form_id} and container {self.container_id}")
        MailManager.send_email(
            self.mail_sender,
            self.user_email,
            self.cc_emails,
            'You have a new Form from Psirt team',
            self.access_token
        )

        for i in range(1, MAX_REMINDERS + 1):
            self.tasks.append(
                send_reminder_task.si(
                    self.mail_sender, form_id, self.container_id, i
                ).set(countdown=i * self.reminder_delay * DAY_SEC)
            )

        if self.escalate:
            self.tasks.append(
                escalate_task.si(
                    self.mail_sender, form_id, self.container_id
                ).set(countdown=(MAX_REMINDERS + 1) * self.reminder_delay * DAY_SEC)
            )

        chain(*self.tasks).apply_async()
        logger.info(f"Workflow started with {len(self.tasks)} tasks")


@app.task(bind=True)
def escalate_task(self, mail_sender, form_id, container_id, manual_escalation=False, manuel_escalation_email=None):
    """
    Escalade un formulaire, soit automatiquement après X relances, soit manuellement si la réponse est insatisfaisante.
    """
    form = Form.query.get(form_id)

    if not form or form.status != 'open':
        logger.warning(f"No escalation needed - form {form_id} is no longer open.")
        return "No escalation needed - form is no longer open."

    form_container = FormContainer.query.get(container_id)
    to =  manuel_escalation_email if manual_escalation  and manuel_escalation_email else form_container.escalade_email
    MailManager.send_email(
        mail_sender=mail_sender,
        to=to,
        cc=form_container.cc_emails,
        title="Please respond to the form.",
        access_token=form_container.access_token,
        workflow_step='escalate'
    )

    event_type = "Manual Escalation" if manual_escalation else "Automatic Escalation"
    timeline_entry = TimelineEntry(
        form_container_id=container_id,
        form_id=form_id,
        event=event_type,
        timestamp=datetime.utcnow(),
        details=f"{event_type} sent to manager {to}"
    )
    db.session.add(timeline_entry)
    form.workflow_step = 'escalate'
    db.session.commit()

    logger.info(f"{event_type} sent for form {form_id}")
    return f"{event_type} sent"


@app.task(bind=True)
def send_reminder_task(self, mail_sender, form_id, container_id, reminder_count):
    logger.info(f"Sending reminder {reminder_count} for form {form_id} and container {container_id}")
    form = Form.query.get(form_id)
    if not form or form.status != 'open':
        logger.warning(f"No reminder needed - form {form_id} is no longer open.")
        return "No reminder needed - form is no longer open."

    form_container = FormContainer.query.get(container_id)

    MailManager.send_email(
        mail_sender=mail_sender,
        to=form_container.user_email,
        cc=form_container.cc_emails,
        title="Please respond to the form.",
        access_token=form_container.access_token,
        workflow_step='reminder'
    )

    timeline_entry = TimelineEntry(
        form_container_id=container_id,
        form_id=form_id,
        event=f"Reminder {reminder_count} sent",
        timestamp=datetime.utcnow(),
        details=f"Reminder {reminder_count} sent to user {form_container.user_email}"
    )
    db.session.add(timeline_entry)
    form.workflow_step = 'reminder'
    db.session.commit()

    logger.info(f"Reminder {reminder_count} sent for form {form_id}")
    return f"Reminder {reminder_count} sent"
