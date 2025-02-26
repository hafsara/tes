import logging

import pycountry
from celery import chain
from datetime import datetime, timedelta, date
from workalendar.registry import registry
from api.models import Form, FormContainer, TimelineEntry
from api.extensions import db
from .email_manager import MailManager
from .celery_app import celery as app

logger = logging.getLogger(__name__)

MAX_REMINDERS = 3
DAY_SEC = 86400


class WorkflowManager:
    def __init__(self, form_container, working_day=False):
        self.mail_sender = form_container.application.mail_sender
        self.user_email = form_container.user_email
        self.cc_emails = form_container.cc_emails if form_container.cc_emails else []
        self.access_token = form_container.access_token
        self.escalate = form_container.escalate
        self.container_id = form_container.id
        self.tasks = []
        self.country_code = self.get_country_code()

        if self.country_code and working_day:
            self.reminder_delay = self.adjust_for_working_days(form_container.reminder_delay)
        else:
            self.reminder_delay = form_container.reminder_delay

    def adjust_for_working_days(self, delay_days):
        """Convert delay_days into actual working days, excluding weekends and public holidays."""
        current_date = date.today()
        cal = registry.get(self.country_code)()
        public_holidays = set(cal.holidays(current_date.year))

        days_counted = 0
        while days_counted < delay_days:
            current_date += timedelta(days=1)
            if cal.is_working_day(current_date) and current_date not in public_holidays:
                days_counted += 1

        return (current_date - date.today()).days

    @staticmethod
    def get_user_country(user_email):
        country = 'France'
        return country

    def get_country_code(self):
        """Convert country name to ISO Alpha-2 country code."""
        try:
            country_name = self.get_user_country(self.user_email)
            return pycountry.countries.lookup(country_name).alpha_2
        except LookupError:
            logger.warning(f"Invalid country name: {country_name}.")
            return None

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
                send_reminder_task.si(form_id, self.container_id, i
                                      ).set(countdown=i * self.reminder_delay * DAY_SEC)
            )

        if self.escalate:
            self.tasks.append(
                escalate_task.si(form_id, self.container_id
                                 ).set(countdown=(MAX_REMINDERS + 1) * self.reminder_delay * DAY_SEC)
            )

        chain(*self.tasks).apply_async()
        logger.info(f"Workflow started with {len(self.tasks)} tasks")


@app.task(bind=True)
def escalate_task(self, form_id, container_id, manual_escalation=False, manual_escalation_email=None):
    """
    Escalade un formulaire, soit automatiquement après X relances, soit manuellement si la réponse est insatisfaisante.
    """
    form = Form.query.filter_by(id=form_id, status='open').first()
    form_container = FormContainer.query.get(container_id)

    if not form or not form_container:
        return {"status": "skipped", "message": f"Escalation skipped for form {form_id} - {container_id}"}

    to = manual_escalation_email if manual_escalation and manual_escalation_email else form_container.escalade_email
    MailManager.send_email(
        mail_sender=form_container.application.mail_sender,
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
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        logger.error(f"Database commit failed: {e}")
        return {"status": "error", "message": str(e)}

    return {"status": "success", "task": "escalate", "form_id": form_id, "access_token": form_container.access_token}


@app.task(bind=True)
def send_reminder_task(self, form_id, container_id, reminder_count):
    logger.info(f"Sending reminder {reminder_count} for form {form_id} and container {container_id}")
    form = Form.query.filter_by(id=form_id, status='open').first()
    form_container = FormContainer.query.get(container_id)

    if not form or not form_container:
        return {"status": "skipped", "message": f"Reminder skipped for form {form_id} - {container_id}"}

    MailManager.send_email(
        mail_sender=form_container.application.mail_sender,
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
    return {"status": "success", "task": "reminder", "form_id": form_id, "access_token": form_container.access_token,
            "reminder_count": reminder_count}
