from datetime import date, datetime, timedelta
from unittest.mock import patch, MagicMock
import pytest
from freezegun import freeze_time
from api.models import Form, FormContainer, TimelineEntry, Application
from workflow.tasks import (
    WorkflowManager,
    send_reminder_task,
    send_escalate_task,
    revoke_chain_authority,
    RevokeChainRequested
)
from celery.contrib.testing.worker import start_worker


@pytest.fixture(scope="module")
def celery_worker(app):
    """Start a Celery worker for testing."""
    with start_worker(app.worker, perform_ping_check=False):
        yield


@pytest.fixture
def mock_form():
    """Fixture to create a mock Form object."""
    form = MagicMock()
    form.id = 123
    form.status = "open"
    form.workflow_step = "reminder"
    return form


@pytest.fixture
def mock_workflow():
    """Fixture to create a mock Workflow object."""
    workflow = MagicMock()
    workflow.id = 1
    workflow.name = "Test Workflow"
    workflow.steps = [
        {"id": "step1", "label": "Start", "type": "start", "delay": 0},
        {"id": "step2", "type": "reminder", "label": "Reminder 1", "delay": 1},
        {"id": "step3", "type": "escalation", "label": "Escalation 1", "delay": 1},
    ]
    return workflow


@pytest.fixture
def mock_form_container(mock_workflow, application):
    """Fixture to create a mock FormContainer object."""
    form_container = MagicMock()
    form_container.id = 456
    form_container.user_email = "user@example.com"
    form_container.cc_emails = ["manager@example.com"]
    form_container.access_token = "fake_access_token"
    form_container.escalade_email = "escalade@example.com"
    form_container.workflow = mock_workflow
    form_container.application = application
    form_container.escalate = True
    form_container.use_working_days = True
    return form_container


@pytest.fixture
def workflow_manager(mock_form_container):
    """Fixture to initialize a WorkflowManager instance."""
    return WorkflowManager(form_container=mock_form_container)


@pytest.fixture
def application():
    """Fixture to initialize a WorkflowManager instance."""
    application = MagicMock()
    application.id = 1
    application.name = "test_app"
    application.created_by = "user-test"
    application.mail_sender = "test-app@exemple.com"
    return application


def test_start_workflow(app, workflow_manager):
    """Test workflow initialization with correct steps."""
    with app.app_context():
        with patch("workflow.tasks.MailManager.send_email") as mock_send_email, patch(
                "workflow.tasks.chain") as mock_chain:
            workflow_manager.start_workflow(form_id=123)

            mock_send_email.assert_called_once_with(
                workflow_manager.mail_sender,
                workflow_manager.user_email,
                workflow_manager.cc_emails,
                "You have a new Form from Psirt team",
                workflow_manager.access_token,
            )

            expected_task_count = len(workflow_manager.workflow.steps) - 1
            assert len(workflow_manager.tasks) == expected_task_count
            mock_chain.assert_called_once()


@pytest.mark.usefixtures("app_context")
def test_escalation_triggers_correctly(app, workflow_manager):
    """Test escalation is triggered at the right time."""
    with patch("workflow.tasks.send_escalate_task.subtask") as mock_escalate:
        workflow_manager.start_workflow(form_id=123)

        if workflow_manager.escalate:
            mock_escalate.assert_called_once()


def test_send_reminder_task(app, mock_form, mock_form_container):
    """Test that send_reminder_task sends an email and logs the event."""
    with app.app_context():
        with patch("workflow.tasks.db.session.get",
                   side_effect=lambda model, id: mock_form if model == Form else mock_form_container), \
                patch("workflow.tasks.db.session") as mock_db_session:
            result = send_reminder_task(form_id=123, container_id=456, reminder_count=1)
            mock_db_session.add.assert_called_once()
            mock_db_session.commit.assert_called_once()
            assert result["status"] == "success"
            assert result["task"] == "reminder"
            assert result["reminder_count"] == 1


def test_send_escalate_task(app, mock_form, mock_form_container):
    """Test that send_escalate_task sends an escalation email and logs the event."""
    with app.app_context():
        with patch("workflow.tasks.db.session.get",
                   side_effect=lambda model, id: mock_form if model == Form else mock_form_container), \
                patch("workflow.tasks.MailManager.send_email") as mock_send_email, \
                patch("workflow.tasks.db.session") as mock_db_session:
            result = send_escalate_task(form_id=123, container_id=456)
            mock_db_session.add.assert_called_once()
            mock_db_session.commit.assert_called_once()
            assert result["status"] == "success"
            assert result["task"] == "escalate"


@freeze_time("2025-02-27")
def test_adjust_for_working_days_skips_holidays(workflow_manager, mocker):
    """Test that adjust_for_working_days correctly skips weekends and holidays."""
    mock_calendar = mocker.MagicMock()
    mock_calendar.is_working_day.side_effect = lambda d: d.weekday() < 5
    mock_calendar.holidays.return_value = [date(2025, 3, 3)]

    mocker.patch("workflow.tasks.registry.get", return_value=lambda: mock_calendar)

    start_date = date(2025, 2, 27)
    delay_days = 3

    expected_date = date(2025, 3, 5)
    result = workflow_manager.adjust_for_working_days(start_date, delay_days)
    assert result == expected_date, f"Expected {expected_date}, got {result}"


def test_revoke_chain_authority():
    """Test that the Celery chain is interrupted correctly in case of an exception."""

    class MockTask:
        request = MagicMock(callbacks=["test_callback"])

    @revoke_chain_authority
    def mock_task(self, *args, **kwargs):
        raise RevokeChainRequested({"status": "skipped"})

    mock_task_instance = MockTask()
    result = mock_task(mock_task_instance)

    assert result == {"status": "skipped"}
    assert mock_task_instance.request.callbacks == []


def test_get_country_code_valid(mock_form_container):
    """Test that the country code is correctly retrieved for a valid email."""
    manager = WorkflowManager(mock_form_container)
    patch.object(manager, 'get_user_country', return_value='France')
    assert manager.get_country_code() == "FR"


def test_get_country_code_invalid(mock_form_container):
    """Test that an invalid country returns 'FR' by default."""
    manager = WorkflowManager(mock_form_container)
    with patch("workflow.tasks.pycountry.countries.lookup", side_effect=LookupError):
        assert manager.get_country_code() == "FR"
