from celery_app import celery
from models import FormContainer
from workflow_manager import FormWorkflowManager


@celery.task
def check_reminders_and_escalations():
    open_containers = FormContainer.query.filter_by(validated=False).all()
    for container in open_containers:
        workflow_manager = FormWorkflowManager(container_id=container.id)
        workflow_manager.process_workflow()
