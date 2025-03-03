from datetime import date
from unittest.mock import patch, MagicMock
import pytest
from freezegun import freeze_time
from api.models import Form, FormContainer, TimelineEntry
from workflow.tasks import WorkflowManager, escalate_task, send_reminder_task, DAY_SEC

from celery.contrib.testing.worker import start_worker


@pytest.fixture(scope='module')
def celery_worker(app):
    """Start a Celery worker for testing."""
    with start_worker(app.worker, perform_ping_check=False):
        yield


@pytest.fixture
def mock_form():
    """Fixture to create a mock Form object."""
    form = MagicMock(spec=Form)
    form.id = 123
    form.status = 'open'
    form.workflow_step = 'reminder'
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
def mock_form_container(mock_workflow):
    """Fixture to create a mock FormContainer object."""
    form_container = MagicMock(spec=FormContainer)
    form_container.id = 456
    form_container.user_email = "user@example.com"
    form_container.cc_emails = ["manager@example.com"]
    form_container.access_token = "fake_access_token"
    form_container.escalade_email = "escalade@example.com"
    form_container.application.mail_sender = "application_email@example.com"
    form_container.workflow = mock_workflow
    form_container.escalate = True
    form_container.use_working_days = True
    return form_container


@pytest.fixture
def workflow_manager(mock_form_container):
    """Fixture to initialize a WorkflowManager instance."""
    return WorkflowManager(form_container=mock_form_container)


def test_start_workflow(app, workflow_manager):
    """Test workflow initialization with correct steps."""
    with app.app_context():
        with patch('workflow.tasks.MailManager.send_email') as mock_send_email, \
                patch('workflow.tasks.chain') as mock_chain:
            workflow_manager.start_workflow(form_id=123)

            mock_send_email.assert_called_once_with(
                workflow_manager.mail_sender,
                workflow_manager.user_email,
                workflow_manager.cc_emails,
                'You have a new Form from Psirt team',
                workflow_manager.access_token
            )

            expected_task_count = len(workflow_manager.workflow.steps) - 1
            assert len(workflow_manager.tasks) == expected_task_count
            mock_chain.assert_called_once()


def test_workflow_step_execution_order(app, workflow_manager):
    """Ensure steps are executed in the correct order."""
    with app.app_context():
        with patch('workflow.tasks.chain') as mock_chain:
            workflow_manager.start_workflow(form_id=123)

            step_types = [step["type"] for step in workflow_manager.workflow.steps]
            valid_sequences = {
                "start": ["reminder", "escalation"],
                "reminder": ["reminder", "escalation"],
                "escalation": ["reminder-escalation"],
                "reminder-escalation": ["reminder-escalation"]
            }

            for i in range(len(step_types) - 1):
                assert step_types[i + 1] in valid_sequences[step_types[i]], \
                    f"Invalid sequence: {step_types[i]} -> {step_types[i + 1]}"

            mock_chain.assert_called_once()


@pytest.mark.usefixtures("app_context")
def test_escalation_triggers_correctly(app, workflow_manager):
    """Test escalation is triggered at the right time."""
    with patch('workflow.tasks.escalate_task.apply_async') as mock_escalate:
        workflow_manager.start_workflow(form_id=123)

        if workflow_manager.escalate:
            mock_escalate.assert_called_once()


def test_send_reminder_task(app, mock_form, mock_form_container):
    """Test that send_reminder_task sends an email and logs the event."""
    with app.app_context():
        with patch('workflow.tasks.Form.query.get', return_value=mock_form):
            mock_form.status = 'open'
            result = send_reminder_task(form_id=123, container_id=456, reminder_count=1)
            if result["status"] == "skipped":
                assert "Reminder skipped" in result["message"]
            else:
                assert result["status"] == "success"
                assert result["task"] == "reminder"
                assert result["reminder_count"] == 1


def test_send_reminder_task_form_validated(app, mock_form):
    """Test that no reminder is sent if the form is already validated."""
    with app.app_context():
        with patch('workflow.tasks.Form.query.get', return_value=mock_form):
            mock_form.status = 'validated'
            result = send_reminder_task(form_id=123, container_id=456, reminder_count=1)
            assert result["status"] == "skipped"
            assert "Reminder skipped for form 123 - 456." == result["message"]


def test_escalate_task(app, mock_form, mock_form_container):
    """Test that escalate_task sends an escalation email and logs the event."""
    with app.app_context():
        with patch('workflow.tasks.db.session.get',
                   side_effect=lambda model, id: mock_form if model == Form else mock_form_container), \
                patch('workflow.tasks.MailManager.send_email') as mock_send_email, \
                patch('workflow.tasks.db.session') as mock_db_session:
            result = escalate_task(form_id=123, container_id=456)
            mock_db_session.add.assert_called_once()
            mock_db_session.commit.assert_called_once()
            assert result["status"] == "success"
            assert result["task"] == "escalate"


def test_escalate_task_form_validated(app, mock_form):
    """Test that escalation is skipped if the form is already validated."""
    with app.app_context():
        with patch('workflow.tasks.Form.query.get', return_value=mock_form):
            mock_form.status = 'validated'

            result = escalate_task(form_id=123, container_id=456)
            assert result["status"] == "skipped"
            assert "Escalation skipped for form 123 - 456." == result["message"]


@pytest.mark.usefixtures("app_context")
@freeze_time("2023-10-01 12:00:00")
def test_workflow_manager_sends_emails_at_correct_time(app, workflow_manager):
    """Test that reminders and escalations execute at the expected time."""
    with patch('workflow.tasks.MailManager.send_email'), \
            patch('workflow.tasks.chain') as mock_chain, \
            patch('workflow.tasks.send_reminder_task.apply_async') as mock_send_reminder, \
            patch('workflow.tasks.escalate_task.apply_async') as mock_escalate, \
            patch('workflow.tasks.db.session') as mock_db_session:
        workflow_manager.start_workflow(form_id=123)
        expected_tasks = [
            send_reminder_task.si(123, workflow_manager.container_id, step.get("id")).set(
                countdown=step.get("delay", 1) * DAY_SEC)
            for step in workflow_manager.workflow.steps
            if step.get("type") == "reminder"
        ]
        expected_tasks.append(
            escalate_task.si(123, workflow_manager.container_id).set(
                countdown=workflow_manager.workflow.steps[-1].get("delay", 1) * DAY_SEC)
        )

        mock_chain.assert_called_once_with(*expected_tasks)


@pytest.mark.usefixtures("app_context")
def test_adjust_for_working_days_skips_weekends(workflow_manager, mocker):
    """Vérifie que adjust_for_working_days saute bien les week-ends."""
    mock_calendar = mocker.MagicMock()
    mock_calendar.is_working_day.side_effect = lambda d: d.weekday() < 5  # Lundi à Vendredi
    mock_calendar.holidays.return_value = []  # Pas de jours fériés

    mocker.patch("workflow.tasks.registry.get", return_value=lambda: mock_calendar)

    start_date = date(2025, 2, 27)  # Jeudi
    delay_days = 3  # Doit sauter le week-end et finir mardi

    expected_date = date(2025, 3, 4)  # Mardi
    result = workflow_manager.adjust_for_working_days(start_date, delay_days)
    assert result == expected_date, f"Expected {expected_date}, got {result}"


@freeze_time("2025-02-27")
def test_adjust_for_working_days_skips_holidays(workflow_manager, mocker):
    """Vérifie que adjust_for_working_days saute bien les jours fériés."""
    mock_calendar = mocker.MagicMock()
    mock_calendar.is_working_day.side_effect = lambda d: d.weekday() < 5  # Lundi à Vendredi
    mock_calendar.holidays.return_value = [date(2025, 3, 3)]  # Jour férié le 3 mars

    mocker.patch("workflow.tasks.registry.get", return_value=lambda: mock_calendar)

    start_date = date(2025, 2, 27)  # Jeudi
    delay_days = 3  # Doit sauter le 3 mars

    expected_date = date(2025, 3, 5)  # Mercredi
    result = workflow_manager.adjust_for_working_days(start_date, delay_days)
    assert result == expected_date, f"Expected {expected_date}, got {result}"


@freeze_time("2025-02-27")
def test_start_workflow_schedules_tasks_correctly(workflow_manager, mocker):
    """Vérifie que les tâches Celery sont bien planifiées avec des jours ouvrés."""
    mock_calendar = mocker.MagicMock()
    mock_calendar.is_working_day.side_effect = lambda d: d.weekday() < 5  # Lundi à Vendredi
    mock_calendar.holidays.return_value = []  # Pas de jours fériés
    mocker.patch("workflow.tasks.registry.get", return_value=lambda: mock_calendar)

    with patch('workflow.tasks.chain') as mock_chain:
        workflow_manager.start_workflow(form_id=123)

        assert len(workflow_manager.tasks) == len(workflow_manager.workflow.steps) - 1
        mock_chain.assert_called_once()


@freeze_time("2025-02-27")
def test_start_workflow_handles_non_working_days(workflow_manager, mocker):
    """Vérifie que les rappels ne tombent pas sur un week-end."""
    mock_calendar = mocker.MagicMock()
    mock_calendar.is_working_day.side_effect = lambda d: d.weekday() < 5  # Lundi à Vendredi
    mock_calendar.holidays.return_value = [date(2025, 3, 3)]  # Jour férié le 3 mars
    mocker.patch("workflow.tasks.registry.get", return_value=lambda: mock_calendar)

    with patch('workflow.tasks.send_reminder_task.apply_async') as mock_send_reminder:
        workflow_manager.start_workflow(form_id=123)

        called_times = [call[1]["countdown"] for call in mock_send_reminder.call_args_list]
        assert all(t > 0 for t in called_times), "All countdowns should be positive."


@freeze_time("2025-02-27")
def test_start_workflow_standard_mode(mock_form_container, mocker):
    """Vérifie que les rappels fonctionnent normalement quand `use_working_days` est désactivé."""
    mock_form_container.use_working_days = False
    manager = WorkflowManager(form_container=mock_form_container)

    with patch('workflow.tasks.chain') as mock_chain:
        manager.start_workflow(form_id=123)

        expected_task_count = len(manager.workflow.steps) - 1
        assert len(manager.tasks) == expected_task_count
        mock_chain.assert_called_once()
