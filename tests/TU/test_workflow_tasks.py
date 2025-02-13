import pytest
from unittest.mock import patch, MagicMock
from flask import Flask
from backend.api.models import Form, FormContainer
from backend.api.extensions import db as _db
from backend.workflow.tasks import WorkflowManager, escalate_task, send_reminder_task, MAX_REMINDERS


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
def workflow_manager():
    return WorkflowManager(
        mail_sender="noreply@example.com",
        user_email="user@example.com",
        cc_emails=["manager@example.com"],
        access_token="fake_access_token",
        reminder_delay=1  # 1 jour
    )


@pytest.fixture
def mock_form(db_session):
    form = MagicMock(spec=Form)
    form.status = 'open'
    form.workflow_step = 'reminder'
    return form


@pytest.fixture
def mock_form_container(db_session):
    form_container = MagicMock(spec=FormContainer)
    form_container.user_email = "user@example.com"
    form_container.cc_emails = ["manager@example.com"]
    form_container.access_token = "fake_access_token"
    form_container.escalade_email = "escalade@example.com"
    return form_container


@pytest.fixture
def mock_db_session(db_session):
    return MagicMock(spec=db_session)


# Tests pour WorkflowManager
def test_start_workflow(app, workflow_manager, mock_db_session):
    with app.app_context():
        with patch('backend.workflow.tasks.MailManager.send_email') as mock_send_email, \
                patch('backend.workflow.tasks.chain') as mock_chain:
            # Call the start_workflow method
            workflow_manager.start_workflow(form_id=123, container_id=456, escalate=True)

            # Verify that the initial email was sent
            mock_send_email.assert_called_once_with(
                "noreply@example.com",
                "user@example.com",
                ["manager@example.com"],
                'You have a new Form from Psirt team',
                "fake_access_token"
            )

            # Verify that the tasks have been configured correctly
            assert len(workflow_manager.tasks) == MAX_REMINDERS + 1
            mock_chain.assert_called_once()


def test_start_workflow_without_escalate(app, workflow_manager, mock_db_session):
    with app.app_context():
        with patch('backend.workflow.tasks.MailManager.send_email') as mock_send_email, \
                patch('backend.workflow.tasks.chain') as mock_chain:
            # Call the start workflow method without escalation
            workflow_manager.start_workflow(form_id=123, container_id=456, escalate=False)

            # Verify that the initial email was sent
            mock_send_email.assert_called_once_with(
                "noreply@example.com",
                "user@example.com",
                ["manager@example.com"],
                'You have a new Form from Psirt team',
                "fake_access_token"
            )

            # Verify that the tasks have been configured correctly
            assert len(workflow_manager.tasks) == MAX_REMINDERS
            mock_chain.assert_called_once()


def test_send_reminder_task(app, mock_form, mock_form_container, mock_db_session):
    with app.app_context():
        with patch('backend.workflow.tasks.Form.query') as mock_form_query, \
                patch('backend.workflow.tasks.FormContainer.query') as mock_form_container_query, \
                patch('backend.workflow.tasks.MailManager.send_email') as mock_send_email, \
                patch('backend.workflow.tasks.db.session', mock_db_session):
            # Simulate database queries
            mock_form_query.get.return_value = mock_form
            mock_form_container_query.get.return_value = mock_form_container

            # Call the send_reminder_task task
            result = send_reminder_task(mail_sender="noreply@example.com", form_id=123, container_id=456,
                                        reminder_count=1)

            # Verify that the email was sent
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


def test_send_reminder_task_form_closed(app, mock_form, mock_db_session):
    with app.app_context():
        with patch('backend.workflow.tasks.Form.query') as mock_form_query:
            # Simulate a closed form
            mock_form.status = 'closed'
            mock_form_query.get.return_value = mock_form

            # Call the send_reminder_task task
            result = send_reminder_task(mail_sender="noreply@example.com", form_id=123, container_id=456,
                                        reminder_count=1)

            # Check that the email has not been sent
            assert result == "No reminder needed - form is no longer open."


def test_escalate_task(app, mock_form, mock_form_container, mock_db_session):
    with app.app_context():
        with patch('backend.workflow.tasks.Form.query') as mock_form_query, \
                patch('backend.workflow.tasks.FormContainer.query') as mock_form_container_query, \
                patch('backend.workflow.tasks.MailManager.send_email') as mock_send_email, \
                patch('backend.workflow.tasks.db.session', mock_db_session):
            # Simulate database queries
            mock_form_query.get.return_value = mock_form
            mock_form_container_query.get.return_value = mock_form_container

            # Call the escalate_task task
            result = escalate_task(mail_sender="noreply@example.com", form_id=123, container_id=456)

            # Verify that the escalation email was sent
            mock_send_email.assert_called_once_with(
                mail_sender="noreply@example.com",
                to="escalade@example.com",
                cc=["manager@example.com"],
                title="Please respond to the form.",
                access_token="fake_access_token",
                workflow_step='escalate'
            )

            # Check that the timeline has been updated
            mock_db_session.add.assert_called_once()
            mock_db_session.commit.assert_called_once()

            # Check the task result
            assert result == "Escalation sent"


def test_escalate_task_form_closed(app, mock_form, mock_db_session):
    with app.app_context():
        with patch('backend.workflow.tasks.Form.query') as mock_form_query:
            # Simulate a closed form
            mock_form.status = 'closed'
            mock_form_query.get.return_value = mock_form

            # Call the escalate_task task
            result = escalate_task(mail_sender="noreply@example.com", form_id=123, container_id=456)

            # Check that the escalation email has not been sent
            assert result == "No escalation needed - form is no longer open."


def test_email_send_timing_for_reminders(app, workflow_manager):
    with app.app_context():
        with patch('backend.workflow.tasks.chain') as mock_chain:
            reminder_delay = 1

            # Lancer le workflow avec escalade activée
            workflow_manager.start_workflow(
                mail_sender="noreply@example.com",
                form_id=123,
                container_id=456,
                escalate=True,
                reminder_delay=reminder_delay
            )

            # Vérifier les décomptes pour les rappels
            expected_delays = [i * reminder_delay * DAY_SEC for i in range(MAX_REMINDERS)]
            actual_delays = [task.options['countdown'] for task in workflow_manager.tasks if 'reminder' in str(task)]

            assert sorted(actual_delays) == sorted(expected_delays), (
                f"Expected reminder delays: {expected_delays}, but got: {actual_delays}"
            )


# ✅ Test pour vérifier le décompte de l'escalade
def test_email_send_timing_for_escalation(app, workflow_manager):
    with app.app_context():
        with patch('backend.workflow.tasks.chain') as mock_chain:
            reminder_delay = 1

            # Lancer le workflow avec escalade activée
            workflow_manager.start_workflow(
                mail_sender="noreply@example.com",
                form_id=123,
                container_id=456,
                escalate=True,
                reminder_delay=reminder_delay
            )

            # Calculer le délai attendu pour l'escalade
            expected_escalation_delay = (MAX_REMINDERS) * reminder_delay * DAY_SEC
            actual_escalation_delays = [
                task.options['countdown'] for task in workflow_manager.tasks if 'escalate' in str(task)
            ]

            assert expected_escalation_delay in actual_escalation_delays, (
                f"Expected escalation delay: {expected_escalation_delay}, but got: {actual_escalation_delays}"
            )


def test_send_reminder_task_timing(app, mock_form, mock_form_container, mock_db_session):
    with app.app_context():
        with patch('backend.workflow.tasks.Form.query') as mock_form_query, \
             patch('backend.workflow.tasks.MailManager.send_email') as mock_send_email:

            mock_form_query.get.return_value = mock_form

            # Exécuter la tâche d'envoi de rappel
            send_reminder_task(
                mail_sender="noreply@example.com",
                form_id=123,
                container_id=456,
                reminder_count=2
            )

            # Vérifier que le mail a été envoyé
            mock_send_email.assert_called_once_with(
                mail_sender="noreply@example.com",
                to=mock_form_container.user_email,
                cc=mock_form_container.cc_emails,
                title="Please respond to the form.",
                access_token="fake_access_token",
                workflow_step='reminder'
            )


def test_escalate_task_timing(app, mock_form, mock_form_container, mock_db_session):
    with app.app_context():
        with patch('backend.workflow.tasks.Form.query') as mock_form_query, \
             patch('backend.workflow.tasks.MailManager.send_email') as mock_send_email:

            mock_form_query.get.return_value = mock_form

            # Exécuter la tâche d'envoi d'escalade
            escalate_task(
                mail_sender="noreply@example.com",
                form_id=123,
                container_id=456
            )

            # Vérifier que le mail d'escalade a été envoyé
            mock_send_email.assert_called_once_with(
                mail_sender="noreply@example.com",
                to=mock_form_container.escalade_email,
                cc=mock_form_container.cc_emails,
                title="Please respond to the form.",
                access_token="fake_access_token",
                workflow_step='escalate'
            )
