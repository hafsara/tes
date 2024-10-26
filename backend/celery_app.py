from celery import Celery
from celery.schedules import crontab
from config import Config


def make_celery():
    celery = Celery(__name__)
    celery.conf.broker_url = Config.CELERY_BROKER_URL
    celery.conf.result_backend = Config.CELERY_RESULT_BACKEND

    # Configuration du planificateur pour la tâche périodique
    celery.conf.beat_schedule = {
        'check-reminders-every-10-minutes': {
            'task': 'tasks.check_reminders',
            'schedule': crontab(minute='*/10'),  # toutes les 10 minutes
        },
    }

    return celery


celery = make_celery()
