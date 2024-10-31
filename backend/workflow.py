from SpiffWorkflow.specs import WorkflowSpec
from SpiffWorkflow.task import Task as TaskSpec
from SpiffWorkflow import Workflow
from SpiffWorkflow.exceptions import WorkflowException
from datetime import datetime, timedelta
from models import FormContainer
from email_manager import send_email
from config import Config


class ReminderTask(TaskSpec):
    def __init__(self, name, delay):
        super().__init__(name)
        self.delay = delay

    def can_be_started(self, task):
        return datetime.utcnow() >= (task.created_date + timedelta(days=self.delay))


class EscalationTask(TaskSpec):
    def can_be_started(self, task):
        return task.get_data('reminder_sent') is True and not task.get_data('user_response')


def create_workflow_spec():
    spec = WorkflowSpec(name="FormWorkflow")
    reminder_task = ReminderTask(name="Send Reminder", delay=Config.REMINDER_DELAY_DAYS)
    escalation_task = EscalationTask(name="Escalate Task")

    spec.start.connect(reminder_task)
    reminder_task.connect(escalation_task)

    return spec


class FormWorkflowManager:
    def __init__(self, container_id):
        self.container_id = container_id
        self.workflow_spec = create_workflow_spec()
        self.workflow = Workflow(self.workflow_spec)

    def process_workflow(self):
        """Avance le workflow pour traiter les rappels et escalades."""
        try:
            while not self.workflow.is_complete():
                task = self.workflow.get_active_task()

                if isinstance(task.task_spec, ReminderTask):
                    self.send_reminder(task)
                elif isinstance(task.task_spec, EscalationTask):
                    self.escalate(task)

                self.workflow.complete_task(task)

        except WorkflowException as e:
            print(f"Workflow error: {e}")

    def send_reminder(self, task):
        form_container = FormContainer.query.get(self.container_id)
        if form_container:
            send_email(
                to=form_container.user_email,
                subject="Rappel : Formulaire en attente de réponse",
                body=f"Veuillez répondre au formulaire {form_container.title}.",
                link=form_container.unique_link
            )
            task.data['reminder_sent'] = True

    def escalate(self, task):
        form_container = FormContainer.query.get(self.container_id)
        if form_container:
            send_email(
                to=form_container.manager_email,
                subject="Escalade : Formulaire en attente",
                body=f"L'utilisateur n'a pas répondu au formulaire {form_container.title}.",
                link=form_container.unique_link
            )
