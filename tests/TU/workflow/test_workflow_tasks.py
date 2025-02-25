import pytest
from unittest.mock import patch, MagicMock
from flask import Flask
from api.models import Form, FormContainer
from api.extensions import db as _db
from workflow.tasks import WorkflowManager, escalate_task, send_reminder_task, MAX_REMINDERS, DAY_SEC
from freezegun import freeze_time


# Create a Flask App for Testing
@pytest.fixture(scope='module')
def app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['TESTING'] = True

    _db.init_app(app)

    with app.app_context():
        _db.create_all()
        yield app
        _db.drop_all()


# Create a database session for testing
@pytest.fixture(scope='function')
def db_session(app):
    with app.app_context():
        yield _db.session
        _db.session.remove()


# Fixtures for test data
@pytest.fixture
def mock_form():
    form = MagicMock(spec=Form)
    form.status = 'open'
    form.workflow_step = 'reminder'
    return form


@pytest.fixture
def mock_form_container():
    form_container = MagicMock(spec=FormContainer)
    form_container.user_email = "user@example.com"
    form_container.cc_emails = ["manager@example.com"]
    form_container.access_token = "fake_access_token"
    form_container.escalade_email = "escalade@example.com"
    return form_container


@pytest.fixture
def workflow_manager(mock_form_container):
    return WorkflowManager(
        form_container=mock_form_container
    )


def test_start_workflow(app, workflow_manager):
    with app.app_context():
        with patch('workflow.tasks.MailManager.send_email') as mock_send_email, \
                patch('workflow.tasks.chain') as mock_chain:
            workflow_manager.start_workflow(form_id=123)

            # Verify that the initial email was sent
            mock_send_email.assert_called_once_with(
                workflow_manager.mail_sender,
                workflow_manager.user_email,
                workflow_manager.cc_emails,
                'You have a new Form from Psirt team',
                workflow_manager.access_token
            )

            # Verify that the tasks have been configured correctly
            assert len(workflow_manager.tasks) == (MAX_REMINDERS + 1 if workflow_manager.escalate else MAX_REMINDERS)
            mock_chain.assert_called_once()


def test_send_reminder_task(app, mock_form, mock_form_container):
    with app.app_context():
        with patch('workflow.tasks.Form.query.get', return_value=mock_form), \
                patch('workflow.tasks.FormContainer.query.get', return_value=mock_form_container), \
                patch('workflow.tasks.MailManager.send_email') as mock_send_email, \
                patch('workflow.tasks.db.session') as mock_db_session:

            result = send_reminder_task(mail_sender="noreply@example.com", form_id=123, container_id=456,
                                        reminder_count=1)

            # Vérifier que l'email a été envoyé
            mock_send_email.assert_called_once_with(
                mail_sender="noreply@example.com",
                to="user@example.com",
                cc=["manager@example.com"],
                title="Please respond to the form.",
                access_token="fake_access_token",
                workflow_step='reminder'
            )

            # Check that the timeline has been updated
            mock_db_session.add.assert_called_once()
            mock_db_session.commit.assert_called_once()

            # Check the task result
            assert result == "Reminder 1 sent"


def test_send_reminder_task_form_closed(app, mock_form):
    with app.app_context():
        with patch('workflow.tasks.Form.query') as mock_form_query:
            # Simulate a closed form
            mock_form.status = 'closed'
            mock_form_query.get.return_value = mock_form

            # Call the send_reminder_task task
            result = send_reminder_task(mail_sender="noreply@example.com", form_id=123, container_id=456,
                                        reminder_count=1)

            # Check that the email has not been sent
            assert result == "No reminder needed - form is no longer open."


# 🟢 **TEST 4: Vérifier que `escalate_task` envoie un email d'escalade**
def test_escalate_task(app, mock_form, mock_form_container):
    with app.app_context():
        with patch('workflow.tasks.Form.query.get', return_value=mock_form), \
                patch('workflow.tasks.FormContainer.query.get', return_value=mock_form_container), \
                patch('workflow.tasks.MailManager.send_email') as mock_send_email, \
                patch('workflow.tasks.db.session') as mock_db_session:
            result = escalate_task(mail_sender="noreply@example.com", form_id=123, container_id=456)

            # Vérifier que l'email d'escalade a été envoyé
            mock_send_email.assert_called_once_with(
                mail_sender="noreply@example.com",
                to="escalade@example.com",
                cc=["manager@example.com"],
                title="Please respond to the form.",
                access_token="fake_access_token",
                workflow_step='escalate'
            )

            # Vérifier que l'événement a été enregistré en base
            mock_db_session.add.assert_called_once()
            mock_db_session.commit.assert_called_once()

            # Vérifier le message de retour
            assert result == "Automatic Escalation sent"


# 🟢 **TEST 5: Vérifier que `escalate_task` ne fait rien si le formulaire est fermé**
def test_escalate_task_form_closed(app, mock_form):
    with app.app_context():
        with patch('workflow.tasks.Form.query.get', return_value=mock_form):
            # Simuler un formulaire fermé
            mock_form.status = 'closed'

            result = escalate_task(mail_sender="noreply@example.com", form_id=123, container_id=456)

            assert result == "No escalation needed - form is no longer open."


def test_workflow_manager_schedules_emails_correctly(app, workflow_manager):
    with app.app_context():
        with patch('workflow.tasks.MailManager.send_email'), \
                patch('workflow.tasks.chain') as mock_chain:

            workflow_manager.start_workflow(form_id=123)

            # Check that tasks are scheduled with the correct countdowns
            expected_tasks = []
            for i in range(1, MAX_REMINDERS + 1):
                expected_tasks.append(
                    send_reminder_task.si(
                        workflow_manager.mail_sender, 123, workflow_manager.container_id, i
                    ).set(countdown=i * workflow_manager.reminder_delay * DAY_SEC)
                )

            if workflow_manager.escalate:
                expected_tasks.append(
                    escalate_task.si(
                        workflow_manager.mail_sender, 123, workflow_manager.container_id
                    ).set(countdown=(MAX_REMINDERS + 1) * workflow_manager.reminder_delay * DAY_SEC)
                )

            # Check that chain is called with the correct countdown
            mock_chain.assert_called_once_with(*expected_tasks)



def test_workflow_manager_sends_emails_at_correct_time(app, workflow_manager):
    with (app.app_context()):
        with patch('workflow.tasks.MailManager.send_email'), \
             patch('workflow.tasks.chain') as mock_chain, \
             patch('workflow.tasks.send_reminder_task.apply_async') as mock_send_reminder, \
             patch('workflow.tasks.escalate_task.apply_async') as mock_escalate,\
             patch('workflow.tasks.db.session') as mock_db_session:

            with freeze_time("2023-10-01 12:00:00"):
                workflow_manager.start_workflow(form_id=123)
                expected_tasks = []
                for i in range(1, MAX_REMINDERS + 1):
                    expected_tasks.append(
                        send_reminder_task.si(
                            workflow_manager.mail_sender, 123, workflow_manager.container_id, i
                        ).set(countdown=i * workflow_manager.reminder_delay * DAY_SEC)
                    )
                expected_tasks.append(
                    escalate_task.si(
                        workflow_manager.mail_sender, 123, workflow_manager.container_id
                    ).set(countdown=(MAX_REMINDERS + 1) * workflow_manager.reminder_delay * DAY_SEC)
                )

                mock_chain.assert_called_once_with(*expected_tasks)
                with freeze_time("2023-10-02 12:00:00"):
                    mock_send_reminder("noreply@example.com", 123, 456, 1, countdown=0)
                    executed_calls = [call.args for call in mock_send_reminder.mock_calls]
                    assert any(
                        call_args == ("noreply@example.com", 123, 456, 1) for call_args in executed_calls
                    ), f"Expected call not found in : {executed_calls}"

                with freeze_time("2023-10-05 12:00:00"):
                    mock_escalate(
                        "noreply@example.com", 123, 456, countdown=0
                    )

                    escalation_calls = [call.args for call in mock_escalate.mock_calls]
                    assert any(
                        call_args == ("noreply@example.com", 123, 456) for call_args in escalation_calls
                    ), f"Expected escalation call not found : {escalation_calls}"
