from celery import Celery

from backend.config import Config


def make_celery():
    celery = Celery(__name__)
    celery.conf.broker_url = Config.CELERY_BROKER_URL
    celery.conf.result_backend = Config.CELERY_RESULT_BACKEND

    celery.conf.beat_schedule = {
        'check-reminders-and-escalations': {
            'task': 'tasks.run_delayed_workflow',
            'schedule': 3600.0
        },
    }

    return celery


celery = make_celery()
