from workflow import process_workflow
from app import celery

@celery.task
def check_reminders():
    # Appel de la fonction de workflow pour chaque formulaire non validé
    from models import Form
    for form in Form.query.filter_by(status='open').all():
        process_workflow(form)
