from celery import shared_task

from celery_app import celery
from workflow import FormWorkflowManager

@shared_task
def run_delayed_workflow(container_id):
    workflow_manager = FormWorkflowManager(container_id=container_id)
    workflow_manager.start_delayed_workflow()
