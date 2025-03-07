import logging
from functools import wraps

import pycountry
from celery import chain
from datetime import datetime, timedelta
from workalendar.registry import registry
from api.models import Form, FormContainer, TimelineEntry
from api.extensions import db
from .email_manager import MailManager
from .celery_app import celery as app

logger = logging.getLogger(__name__)

DAY_SEC = 86400


class RevokeChainRequested(Exception):
    def __init__(self, return_value):
        Exception.__init__(self, "")
        self.return_value = return_value


def revoke_chain_authority(a_task):
    """
    Décorateur pour révoquer la chaîne Celery en cas de condition spécifique.
    """

    @wraps(a_task)
    def inner(self, *args, **kwargs):
        try:
            return a_task(self, *args, **kwargs)
        except RevokeChainRequested as e:
            if self.request.callbacks:
                self.request.callbacks[:] = []
            return e.return_value

    return inner


class WorkflowManager:
    def __init__(self, form_container):
        self.mail_sender = form_container.application.mail_sender
        self.user_email = form_container.user_email
        self.cc_emails = form_container.cc_emails if form_container.cc_emails else []
        self.access_token = form_container.access_token
        self.escalate = form_container.escalate
        self.container_id = form_container.id
        self.tasks = []
        self.country_code = self.get_country_code()
        self.workflow = form_container.workflow
        self.use_working_days = form_container.use_working_days

    def adjust_for_working_days(self, start_date, delay_days):
        """
        Retourne la date réelle en tenant compte des jours ouvrés.
        """
        if not self.country_code:
            return start_date + timedelta(days=delay_days)

        current_date = start_date.date() if isinstance(start_date, datetime) else start_date
        days_counted = 0
        cal = registry.get(self.country_code)()
        years = {start_date.year, (start_date + timedelta(days=delay_days * 2 + 365)).year}
        public_holidays = set()

        for year in years:
            public_holidays.update(cal.holidays(year))

        while days_counted < delay_days:
            current_date += timedelta(days=1)
            if cal.is_working_day(current_date) and current_date not in public_holidays:
                days_counted += 1

        return current_date

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
            return 'FR'

    def start_workflow(self, form_id):
        start_date = datetime.utcnow()
        cumulative_delay = 0

        logger.info(f"Starting workflow for form {form_id} and container {self.container_id}")
        MailManager.send_email(
            self.mail_sender,
            self.user_email,
            self.cc_emails,
            'You have a new Form from Psirt team',
            self.access_token
        )

        if not self.workflow:
            logger.error(f"No workflow assigned to FormContainer {self.container_id}")
            return

        logger.info(f"Using workflow '{self.workflow.name}' for form {form_id}")

        for i, step in enumerate(self.workflow.steps):
            step_type = step.get("type")
            delay_days = step.get("delay", 1)
            cumulative_delay += delay_days

            if self.use_working_days:
                eta_time = self.adjust_for_working_days(start_date, cumulative_delay)
            else:
                eta_time = start_date + timedelta(days=cumulative_delay)

            if step_type == "reminder":
                self.tasks.append(send_reminder_task.subtask(
                    args=(form_id, self.container_id, i),
                    eta=eta_time
                ))
                logger.info(f"Scheduled Reminder {i} for {eta_time}")

            if self.escalate and step_type in ("escalation", "reminder-escalation"):
                self.tasks.append(send_escalate_task.subtask(
                    args=(form_id, self.container_id),
                    eta=eta_time
                ))
                logger.info(f"Scheduled Reminder-Escalation {step.get('id')} for {eta_time}")

        if self.tasks:
            workflow_chain = chain(*self.tasks)
            workflow_chain.apply_async()
        else:
            logger.warning("No tasks scheduled - workflow might be empty")


def _handle_task_common(form_id, container_id, get_recipient, get_event_details, workflow_step,
                        extra_result_fields=None, **kwargs):
    """Helper function centralizing common task logic."""
    form = Form.query.filter_by(id=form_id, status='open').first()
    form_container = FormContainer.query.get(container_id)

    if not form or not form_container:
        raise RevokeChainRequested({
            "status": "skipped",
            "message": f"Task skipped for form {form_id} - {container_id}."
        })

    # Dynamic determination of parameters
    to = get_recipient(form_container, **kwargs)
    event_type, details = get_event_details(form_container, **kwargs)

    MailManager.send_email(
        mail_sender=form_container.application.mail_sender,
        to=to,
        cc=form_container.cc_emails,
        title="Please respond to the form.",
        access_token=form_container.access_token,
        workflow_step=workflow_step
    )

    timeline_entry = TimelineEntry(
        form_container_id=container_id,
        form_id=form_id,
        event=event_type,
        timestamp=datetime.utcnow(),
        details=details
    )
    db.session.add(timeline_entry)
    form.workflow_step = workflow_step

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        logger.error(f"Database commit failed: {e}")
        return {"status": "error", "message": str(e)}

    result = {
        "status": "success",
        "task": workflow_step,
        "form_id": form_id,
        "access_token": form_container.access_token
    }
    if extra_result_fields:
        result.update(extra_result_fields)
    return result


@app.task(bind=True)
@revoke_chain_authority
def send_escalate_task(self, form_id, container_id, manual_escalation=False, manual_escalation_email=None):
    """Send escalate task"""

    def get_recipient(form_container, **kwargs):
        return (
            kwargs.get('manual_escalation_email')
            if kwargs.get('manual_escalation')
            else form_container.escalade_email
        )

    def get_event_details(form_container, **kwargs):
        event_type = "Manual Escalation" if kwargs.get('manual_escalation') else "Automatic Escalation"
        return event_type, f"{event_type} to {form_container.escalade_email}"

    return _handle_task_common(
        form_id,
        container_id,
        get_recipient=get_recipient,
        get_event_details=get_event_details,
        workflow_step='escalate',
        manual_escalation=manual_escalation,
        manual_escalation_email=manual_escalation_email
    )


@app.task(bind=True)
@revoke_chain_authority
def send_reminder_task(self, form_id, container_id, reminder_count):
    """Send reminders tasks """
    logger.info(f"Starting reminder {reminder_count} for {form_id}")

    def get_recipient(form_container, **_):
        return form_container.user_email

    def get_event_details(form_container, **kwargs):
        count = kwargs.get('reminder_count')
        return f"Reminder {count} sent", f"Reminder {count} to {form_container.user_email}"

    result = _handle_task_common(
        form_id,
        container_id,
        get_recipient=get_recipient,
        get_event_details=get_event_details,
        workflow_step='reminder',
        extra_result_fields={'reminder_count': reminder_count},
        reminder_count=reminder_count
    )

    logger.info(f"Reminder {reminder_count} completed for {form_id}")
    return result
