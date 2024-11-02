from flask_sqlalchemy import SQLAlchemy
from celery import Celery

db = SQLAlchemy()


def make_celery(app=None):
    celery = Celery(app.import_name, backend=app.config['CELERY_RESULT_BACKEND'],
                    broker=app.config['CELERY_BROKER_URL'])
    celery.conf.update(app.config)
    return celery
