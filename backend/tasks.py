from workflow import process_workflow
from celery import Celery
from config import Config

celery = Celery(__name__, backend=Config.CELERY_RESULT_BACKEND, broker=Config.CELERY_BROKER_URL)
celery.conf.update(from_object(Config))


@celery.task
def check_reminders():
    # Appel de la fonction de workflow pour chaque formulaire non validé
    from models import Form
    for form in Form.query.filter_by(status='open').all():
        process_workflow(form)
