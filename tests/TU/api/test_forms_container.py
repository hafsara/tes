import pytest
from unittest.mock import patch, MagicMock
from api.models import FormContainer, Form, Campaign, TimelineEntry
from datetime import datetime

from api.extensions import db


@pytest.fixture
def form_container():
    """Creates a mock FormContainer instance."""
    container = FormContainer(
        title="Test Form Container",
        description="Test Form Container description",
        access_token="test_access_token",
        validated=False,
        escalate=True,
        user_email="test@example.com",
        cc_emails=["cc@example.com"],
        escalade_email="escalade@example.com",
        initiated_by='user_id',
        reminder_delay=2,
        app_id=1,
        campaign_id=2
    )
    db.session.add(container)
    db.session.commit()
    return container


@pytest.fixture
def form(form_container):
    """Creates a mock Form instance."""
    test_form = Form(
        form_container_id=form_container.id,
        status="open"
    )
    db.session.add(test_form)
    db.session.commit()
    return test_form


@pytest.fixture
def campaign():
    """
    Fixture pour une campagne valide.
    """
    test_campaign = Campaign(
        name="camp",
        app_id="app_id"
    )
    db.session.add(test_campaign)
    db.session.commit()
    return test_campaign


def test_create_form_container(test_client, form_container, form):
    """Test creating a new form container."""
    with patch("api.models.Campaign.query.filter_by") as mock_campaign_query, \
            patch("api.models.FormContainer") as mock_container_model, \
            patch("api.models.Form") as form_model, \
            patch("api.extensions.db.session.commit") as mock_db_commit:
        mock_campaign_query.return_value.first.return_value = form_container
        mock_container_model.return_value = form_container
        form_model.return_value = form

        payload = {
            "title": "New Container",
            "description": "Description",
            "user_email": "user@example.com",
            "app_id": "app_123",
            "forms": [{"questions": [{"label": "Q1", "type": "text"}]}]
        }

        response = test_client.post("/form-containers", json=payload)

        assert response.status_code == 201
        data = response.get_json()
        assert "container_id" in data
        assert "form_id" in data
        assert "access_token" in data
        mock_db_commit.assert_called()


def test_create_form_container_without_form(test_client):
    """Test failure when creating a form container without a form."""
    payload = {
        "title": "Container without form",
        "description": "Description",
        "user_email": "user@example.com",
        "app_id": "app_123"
    }

    response = test_client.post("/form-containers", json=payload)

    assert response.status_code == 400
    data = response.get_json()
    assert "A form is required to create a container" in data["error"]


def test_get_form_containers(test_client, form_container):
    """Test retrieving form containers with filtering and pagination."""
    with patch("api.models.FormContainer.query.filter") as mock_query, \
            patch("api.schemas.FormContainerListSchema.dump") as mock_schema:
        mock_query.return_value.order_by.return_value.all.return_value = [form_container]
        mock_schema.return_value = [{"id": 1, "title": "Test Container"}]

        response = test_client.get("/form-containers?app_ids=app_123")

        assert response.status_code == 200
        data = response.get_json()
        assert data["total"] == 1
        assert isinstance(data["form_containers"], list)


def test_get_form_container_by_access_token(test_client, form_container):
    """Test retrieving a form container using an access token."""
    with patch("api.models.FormContainer.query.filter_by") as mock_query:
        mock_query.return_value.first_or_404.return_value = form_container

        response = test_client.get(f"/api/v1/form-containers/{form_container.access_token}")

        assert response.status_code == 200
        data = response.get_json()
        assert data["title"] == form_container.title


def test_validate_form_container(test_client, form_container, form):
    """Test validating a form container."""
    with patch("api.models.FormContainer.query.get_or_404") as mock_container_query, \
            patch("api.models.Form.query.filter_by") as form_query, \
            patch("api.extensions.db.session.commit") as mock_db_commit:
        mock_container_query.return_value = form_container
        form_query.return_value.first_or_404.return_value = form

        response = test_client.post("/api/v1/form-containers/1/forms/1/validate", json={"archive": False})

        assert response.status_code == 200
        data = response.get_json()
        assert data["message"] == "Form successfully validated."
        mock_db_commit.assert_called()


def test_cancel_form_container(test_client, form):
    """Test canceling a form within a form container."""
    with patch("api.models.Form.query.filter_by") as form_query, \
            patch("api.extensions.db.session.commit") as mock_db_commit:
        form_query.return_value.first_or_404.return_value = form
        form.status = "open"

        response = test_client.post("/api/v1/form-containers/1/forms/1/cancel", json={"comment": "Not needed anymore"})

        assert response.status_code == 200
        data = response.get_json()
        assert data["message"] == "Form canceled successfully."
        mock_db_commit.assert_called()


def test_get_form_container_timeline(test_client):
    """Test retrieving the timeline of a form container."""
    mock_timeline_entry = MagicMock(
        spec=TimelineEntry, form_container_id=1, form_id=1, event="Form Created",
        details="Test details", timestamp=datetime.utcnow()
    )

    with patch("api.models.TimelineEntry.query.filter_by") as mock_timeline_query:
        mock_timeline_query.return_value.all.return_value = [mock_timeline_entry]

        response = test_client.get("/api/v1/form-containers/1/timeline")

        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        assert data[0]["event"] == "Form Created"


def test_get_total_forms_count(test_client):
    """Test retrieving the total count of forms across all containers."""
    with patch("api.models.db.session.query") as mock_query:
        mock_query.return_value.join.return_value.filter.return_value.count.return_value = 5

        response = test_client.get("/api/v1/form-containers/total-count?app_ids=app_123")

        assert response.status_code == 200
        data = response.get_json()
        assert data["totalCount"] == 5
