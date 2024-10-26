from celery_app import celery  # Assurez-vous que l'instance Celery est bien configurée dans celery_app.py
from models import Form
from form_workflow_manager import FormWorkflowManager  # Classe de gestion du workflow
from datetime import datetime


@celery.task
def check_reminders():
    """Tâche Celery qui vérifie les formulaires ouverts et traite leurs workflows."""
    open_forms = Form.query.filter_by(status='open').all()
    for form in open_forms:
        # Traite le workflow pour chaque formulaire
        form_workflow = FormWorkflowManager(container_id=form.form_container_id)
        form_workflow.process_workflow()
        print(f"Workflow traité pour le formulaire {form.id} à {datetime.utcnow()}")
