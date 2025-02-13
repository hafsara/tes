import pytest
from unittest.mock import patch, MagicMock
from flask import Flask
from backend.api.models import Form, FormContainer
from backend.api.extensions import db as _db
from backend.workflow.tasks import WorkflowManager, escalate_task, send_reminder_task, MAX_REMINDERS, DAY_SEC
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


def test_workflow_manager_schedules_emails_correctly(app, workflow_manager, mock_db_session):
    with app.app_context():
        with patch('backend.workflow.tasks.MailManager.send_email') as mock_send_email, \
             patch('backend.workflow.tasks.chain') as mock_chain, \
             patch('backend.workflow.tasks.send_reminder_task.apply_async') as mock_send_reminder, \
             patch('backend.workflow.tasks.escalate_task.apply_async') as mock_escalate:

            # Call the start_workflow method with escalate=True
            workflow_manager.start_workflow(form_id=123, container_id=456, escalate=True)

            # Check that tasks are scheduled with the correct countdowns
            expected_countdowns = [i * workflow_manager.reminder_delay * DAY_SEC for i in range(1, MAX_REMINDERS + 1)]
            expected_countdowns.append((MAX_REMINDERS + 1) * workflow_manager.reminder_delay * DAY_SEC)

            # Check that send_reminder_task is called with the correct countdowns
            for i, countdown in enumerate(expected_countdowns[:-1]):
                mock_send_reminder.assert_any_call(
                    args=("noreply@example.com", 123, 456, i + 1),
                    countdown=countdown
                )

            # Check that escalate_task is called with the correct countdown
            mock_escalate.assert_called_once_with(
                args=("noreply@example.com", 123, 456),
                countdown=expected_countdowns[-1]
            )


def test_workflow_manager_schedules_emails_without_escalate(app, workflow_manager, mock_db_session):
    with app.app_context():
        with patch('backend.workflow.tasks.MailManager.send_email') as mock_send_email, \
             patch('backend.workflow.tasks.chain') as mock_chain, \
             patch('backend.workflow.tasks.send_reminder_task.apply_async') as mock_send_reminder, \
             patch('backend.workflow.tasks.escalate_task.apply_async') as mock_escalate:

            # Call the start_workflow method with escalate=False
            workflow_manager.start_workflow(form_id=123, container_id=456, escalate=False)

            # Check that tasks are scheduled with the correct countdowns
            expected_countdowns = [i * workflow_manager.reminder_delay * DAY_SEC for i in range(1, MAX_REMINDERS + 1)]

            # Check that send_reminder_task is called with the correct countdowns
            for i, countdown in enumerate(expected_countdowns):
                mock_send_reminder.assert_any_call(
                    args=("noreply@example.com", 123, 456, i + 1),
                    countdown=countdown
                )

            # Check that escalate_task is not called
            mock_escalate.assert_not_called()

def test_workflow_manager_sends_emails_at_correct_time(app, workflow_manager, mock_db_session):
    with app.app_context():
        with patch('backend.workflow.tasks.MailManager.send_email') as mock_send_email, \
             patch('backend.workflow.tasks.chain') as mock_chain, \
             patch('backend.workflow.tasks.send_reminder_task.apply_async') as mock_send_reminder, \
             patch('backend.workflow.tasks.escalate_task.apply_async') as mock_escalate:

            # Simulate time with freezegun
            with freeze_time("2024-10-01 12:00:00"):
                workflow_manager.start_workflow(form_id=123, container_id=456, escalate=True)

                # Advance time to trigger the first restart
                with freeze_time("2024-10-02 12:00:00"):  # reminder_delay = 1 day
                    # Check that the first reminder is sent
                    mock_send_reminder.assert_any_call(
                        args=("noreply@example.com", 123, 456, 1),
                        countdown=0  # The countdown is over
                    )

                # Advance time to trigger escalation
                with freeze_time("2024-10-05 12:00:00"):  # (MAX_REMINDERS + 1) * reminder_delay = 4 jours
                    # Check that the escalation is sent
                    mock_escalate.assert_called_once_with(
                        args=("noreply@example.com", 123, 456),
                        countdown=0  # The countdown is over
                    )