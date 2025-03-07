from unittest.mock import MagicMock

import pytest
from api.extensions import db
from api.models import Workflow

WORKFLOW_URL = "/api/v1/workflows"


@pytest.fixture
def mock_workflow():
    """Mock workflow object."""
    workflow = Workflow(id="123", name="Test Workflow", steps=[{"step": "Start"}], created_by="test_user")
    db.session.add(workflow)
    db.session.commit()
    return workflow


def test_create_workflow(client, mock_workflow, headers):
    """Test POST /workflows - Create a workflow."""
    response = client.post(
        WORKFLOW_URL,
        json={"name": "Test Workflow 1", "steps": [{"step": "Start"}]},
        headers=headers
    )

    assert response.status_code == 201
    data = response.get_json()
    assert "id" in data
    assert "name" in data
    assert "Test Workflow 1" == data.get('name')


def test_get_workflows(client, mock_workflow, headers):
    """Test GET /workflows - Retrieve all workflows."""
    response = client.get(
        WORKFLOW_URL,
        headers=headers,
    )

    data = response.get_json()
    assert isinstance(data, list)
    assert len(data) > 0


def test_delete_workflow(client, mock_workflow, headers):
    """Test DELETE /workflows/<workflow_id> - Delete a workflow."""
    response = client.delete(
        f"{WORKFLOW_URL}/123",
        headers=headers,
    )

    assert response.status_code == 200
    assert response.get_json() == {"message": "Workflow deleted successfully"}


def test_delete_workflow_not_found(client, headers):
    """Test DELETE /workflows/<workflow_id> when workflow does not exist."""
    response = client.delete(
        f'{WORKFLOW_URL}/999',
        headers=headers
    )

    assert response.status_code == 404
    assert response.get_json() == {"error": "Workflow not found"}
