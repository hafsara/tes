from celery import Celery
from config import Config


def make_celery():
    celery = Celery(__name__)
    celery.conf.broker_url = Config.CELERY_BROKER_URL
    celery.conf.result_backend = Config.CELERY_RESULT_BACKEND

    celery.conf.beat_schedule = {
        'check-reminders-and-escalations': {
            'task': 'tasks.check_reminders_and_escalations',
            'schedule': 3600.0,  # toutes les heures
        },
    }

    return celery


celery = make_celery()
