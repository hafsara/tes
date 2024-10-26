from celery_app import celery  # Importez l'instance Celery configurée
from workflow import process_workflow
from models import Form

@celery.task
def check_reminders():
    # Appel de la fonction de workflow pour chaque formulaire non validé
    for form in Form.query.filter_by(status='open').all():
        process_workflow(form)
