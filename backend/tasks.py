from extensions import make_celery
from config import Config
from workflow import process_workflow
from models import Form
from celery.schedules import crontab

from app import app  # Assurez-vous que `app` est bien importé depuis `app.py`

celery = make_celery(app)  # Initialisez l'instance Celery avec l'application Flask


@celery.task
def check_reminders():
    for form in Form.query.filter_by(status='open').all():
        process_workflow(form)


celery.conf.beat_schedule = {
    'check-reminders-every-10-minutes': {
        'task': 'tasks.check_reminders',
        'schedule': crontab(minute='*/10'),  # toutes les 10 minutes
    },
}
