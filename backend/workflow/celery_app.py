from celery import Celery
from config import TestConfig

from api.app import create_app


def make_celery(app):
    celery = Celery(__name__)
    celery.conf.broker_url = TestConfig.CELERY_BROKER_URL
    celery.conf.result_backend = TestConfig.CELERY_RESULT_BACKEND
    celery.conf.broker_connection_retry_on_startup  = True
    task_base = celery.Task

    class ContextTask(task_base):
        abstract = True

        def __call__(self, *args, **kwargs):
            with app.app_context():
                return task_base.__call__(self, *args, **kwargs)

    celery.Task = ContextTask
    return celery


app = create_app(TestConfig)
celery = make_celery(app)
