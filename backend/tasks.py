from extensions import make_celery
from config import Config
from workflow import process_workflow
from models import Form
from celery.schedules import crontab

celery = make_celery()


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
