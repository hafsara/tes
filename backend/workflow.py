from SpiffWorkflow.specs import WorkflowSpec
from SpiffWorkflow.task import Task as TaskSpec
from SpiffWorkflow import Workflow
from SpiffWorkflow.exceptions import WorkflowException


class ReminderTask(TaskSpec):
    def __init__(self, name, delay):
        super().__init__(name=name)
        self.delay = delay

    def execute(self, task):
        # Code pour envoyer un rappel
        print(f"Sending reminder for task: {task.id}")

class EscalationTask(TaskSpec):
    def __init__(self, name):
        super().__init__(name=name)

    def execute(self, task):
        # Code pour gérer l'escalade
        print(f"Escalating task: {task.id}")

def create_workflow_spec():
    spec = WorkflowSpec(name="FormWorkflow")
    reminder_task = ReminderTask(name="Send Reminder", delay=3)  # délai de 3 jours
    escalation_task = EscalationTask(name="Escalate Task")
    spec.start.connect(reminder_task)
    reminder_task.connect(escalation_task)
    return spec

def process_workflow(form):
    workflow = Workflow(create_workflow_spec())
    try:
        while not workflow.is_complete():
            workflow.step()  # Avance le workflow à l'étape suivante
    except WorkflowException as e:
        print(f"Workflow error: {e}")
