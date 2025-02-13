from celery import Celery
from config import Config

def make_celery():
    celery = Celery(__name__)
    celery.conf.broker_url = Config.CELERY_BROKER_URL
    celery.conf.result_backend = Config.CELERY_RESULT_BACKEND

    return celery

celery = make_celery()
