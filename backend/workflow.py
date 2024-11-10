from SpiffWorkflow import Workflow, TaskState
from SpiffWorkflow.exceptions import WorkflowException
from SpiffWorkflow.specs import WorkflowSpec
from datetime import datetime, timedelta
from SpiffWorkflow.specs.base import TaskSpec

from email_manager import send_email
from models import FormContainer
from config import Config


class InitialNotificationTask(TaskSpec):
    def __init__(self, wf_spec, name="Send Initial Notification", **kwargs):
        super().__init__(wf_spec, name, **kwargs)

    def run_task(self, task):
        form_container = FormContainer.query.get(task.data['container_id'])
        if form_container:
            send_email(
                to=form_container.user_email,
                subject="New Form Available",
                body=f"You have a new form to complete: {form_container.title}",
                link=form_container.access_token
            )
            task.data['initial_notification_sent'] = True
        task.set_state(TaskState.COMPLETED)


class ReminderTask(TaskSpec):
    def __init__(self, wf_spec, name="Send Reminder", delay=Config.REMINDER_DELAY_DAYS, **kwargs):
        super().__init__(wf_spec, name, **kwargs)
        self.delay = delay

    def is_task_ready(self, task):
        return datetime.utcnow() >= (task.created_date + timedelta(days=self.delay))

    def run_task(self, task):
        form_container = FormContainer.query.get(task.data['container_id'])
        if form_container:
            send_email(
                to=form_container.user_email,
                subject="Reminder: Form Pending",
                body=f"Please respond to the form: {form_container.title}",
                link=form_container.access_token
            )
            task.data['reminder_sent'] = True
        task.set_state(TaskState.COMPLETED)


class EscalationTask(TaskSpec):
    def __init__(self, wf_spec, name="Escalate Task", **kwargs):
        super().__init__(wf_spec, name, **kwargs)

    def is_task_ready(self, task):
        return task.get_data('reminder_sent') is True and not task.get_data('user_response')

    def run_task(self, task):
        form_container = FormContainer.query.get(task.data['container_id'])
        if form_container:
            send_email(
                to=form_container.manager_email,
                subject="Escalation: Form Pending",
                body=f"The user has not responded to the form: {form_container.title}",
                link=form_container.access_token
            )
        task.set_state(TaskState.COMPLETED)


class StartTask(TaskSpec):
    def __init__(self, wf_spec, name="Start Task", **kwargs):
        super().__init__(wf_spec, name, **kwargs)

def create_workflow_spec():
    spec = WorkflowSpec(name="FormWorkflow")
    start_task = StartTask(spec, name="Start Task")
    initial_notification = InitialNotificationTask(spec, name="Send Initial Notification")
    reminder_task = ReminderTask(spec, name="Send Reminder", delay=Config.REMINDER_DELAY_DAYS)
    escalation_task = EscalationTask(spec, name="Escalate Task")

    # Connect tasks in the workflow
    start_task.connect(initial_notification)
    initial_notification.connect(reminder_task)
    reminder_task.connect(escalation_task)

    spec.start = start_task

    return spec


class FormWorkflowManager:
    def __init__(self, container_id):
        self.container_id = container_id
        self.workflow_spec = create_workflow_spec()
        self.workflow = Workflow(self.workflow_spec)
        self.workflow.data['container_id'] = container_id  # Store the container ID

    def process_workflow(self):
        """Process each task in the workflow, checking readiness and running if ready."""
        try:
            for task in self.workflow.get_tasks(TaskState.READY):
                if task.task_spec.is_task_ready(task):
                    task.task_spec.run_task(task)
                    task.set_state(TaskState.COMPLETED)

        except WorkflowException as e:
            print(f"Workflow processing error: {e}")
        except:
            print('Other exception')
