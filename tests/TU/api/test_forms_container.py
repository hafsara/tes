import pytest
from datetime import datetime
from api.models import FormContainer, Form, Campaign, TimelineEntry
from api.extensions import db


@pytest.fixture
def form_container():
    """Creates a real FormContainer instance in the test database."""
    container = FormContainer(
        title="Test Form Container",
        description="Test Form Container description",
        access_token="test_access_token",
        validated=False,
        escalate=True,
        user_email="test@example.com",
        cc_emails=["cc@example.com"],
        escalade_email="escalade@example.com",
        initiated_by="user_id",
        reminder_delay=2,
        app_id=1,
        campaign_id=2
    )
    db.session.add(container)
    db.session.commit()
    return container


@pytest.fixture
def form(form_container):
    """Creates a real Form instance in the test database."""
    test_form = Form(
        form_container_id=form_container.id,
        status="open"
    )
    db.session.add(test_form)
    db.session.commit()
    return test_form


@pytest.fixture
def campaign():
    """Creates a real Campaign instance in the test database."""
    test_campaign = Campaign(
        name="camp",
        app_id="app_id"
    )
    db.session.add(test_campaign)
    db.session.commit()
    return test_campaign


def test_create_form_container(client):
    """Test creating a new form container."""
    payload = {
        "title": "New Container",
        "description": "Description",
        "user_email": "user@example.com",
        "app_id": "1",
        "forms": [{"questions": [{"label": "Q1", "type": "text"}]}]
    }

    response = client.post("/api/v1/form-containers", json=payload)

    assert response.status_code == 201
    data = response.get_json()
    assert "container_id" in data
    assert "form_id" in data
    assert "access_token" in data


def test_create_form_container_without_form(client):
    """Test failure when creating a form container without a form."""
    payload = {
        "title": "Container without form",
        "description": "Description",
        "user_email": "user@example.com",
        "app_id": "app_123"
    }

    response = client.post("/api/v1/form-containers", json=payload)

    assert response.status_code == 400
    data = response.get_json()
    assert "A form is required to create a container" in data["error"]


def test_get_form_containers(client, form_container):
    """Test retrieving form containers with filtering and pagination."""
    response = client.get("/api/v1/form-containers?app_ids=1")

    assert response.status_code == 200
    data = response.get_json()
    assert data["total"] >= 1
    assert isinstance(data["form_containers"], list)


def test_get_form_container_by_access_token(client, form_container):
    """Test retrieving a form container using an access token."""
    response = client.get(f"/api/v1/form-containers/{form_container.access_token}")

    assert response.status_code == 200
    data = response.get_json()
    assert data["title"] == form_container.title


def test_validate_form_container(client, form_container, form):
    """Test validating a form container."""
    response = client.post(f"/api/v1/form-containers/{form_container.id}/forms/{form.id}/validate", json={"archive": False})

    assert response.status_code == 200
    data = response.get_json()
    assert data["message"] == "Form successfully validated."


def test_cancel_form_container(client, form):
    """Test canceling a form within a form container."""
    response = client.post(f"/api/v1/form-containers/{form.form_container_id}/forms/{form.id}/cancel", json={"comment": "Not needed anymore"})

    assert response.status_code == 200
    data = response.get_json()
    assert data["message"] == "Form canceled successfully."


def test_get_form_container_timeline(client, form_container, form):
    """Test retrieving the timeline of a form container."""
    timeline_entry = TimelineEntry(
        form_container_id=form_container.id,
        form_id=form.id,
        event="Form Created",
        details="Test details",
        timestamp=datetime.utcnow()
    )
    db.session.add(timeline_entry)
    db.session.commit()

    response = client.get(f"/api/v1/form-containers/{form_container.id}/timeline")

    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data, list)
    assert data[0]["event"] == "Form Created"


def test_get_total_forms_count(client):
    """Test retrieving the total count of forms across all containers."""
    response = client.get("/api/v1/form-containers/total-count?app_ids=1")

    assert response.status_code == 200
    data = response.get_json()
    assert "totalCount" in data
