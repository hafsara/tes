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


class FormWorkflowManager:
    def __init__(self, container_id):
        self.container_id = container_id
        self.workflow = Workflow(self.create_workflow_spec())

    @staticmethod
    def create_workflow_spec():
        """Crée une spécification de workflow avec des tâches de rappel et d'escalade."""
        spec = WorkflowSpec(name="FormWorkflow")
        reminder_task = ReminderTask(name="Send Reminder", delay=3)  # délai de 3 jours
        escalation_task = EscalationTask(name="Escalate Task")

        # Connexion des tâches
        spec.start.connect(reminder_task)
        reminder_task.connect(escalation_task)

        return spec

    def process_workflow(self):
        """Traite les étapes du workflow pour le formulaire."""
        try:
            while not self.workflow.is_complete():
                self.workflow.step()  # Avance le workflow à l'étape suivante
        except WorkflowException as e:
            print(f"Workflow error: {e}")

    def stop_workflow(self):
        """Arrête le workflow associé au Form Container en le marquant comme complet."""
        if self.workflow:
            self.workflow.complete_task()  # Marque la tâche comme complète
            self.workflow.save()  # Sauvegarde les changements

    def save_workflow_state(self):
        """Méthode pour sauvegarder l'état actuel du workflow (peut être étendue pour persistance)."""
        # Code pour sauvegarder l'état actuel du workflow (si nécessaire pour la persistance)
        pass
