from celery import Celery
from config import Config
from workflow import process_workflow

def make_celery(app):
    celery = Celery(
        app.import_name,
        backend=app.config['CELERY_RESULT_BACKEND'],
        broker=app.config['CELERY_BROKER_URL']
    )
    celery.conf.update(app.config)
    TaskBase = celery.Task

    class ContextTask(TaskBase):
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return TaskBase.__call__(self, *args, **kwargs)

    celery.Task = ContextTask
    return celery

@celery.task
def check_reminders():
    # Appel de la fonction de workflow pour chaque formulaire non validé
    from models import Form
    for form in Form.query.filter_by(status='open').all():
        process_workflow(form)
