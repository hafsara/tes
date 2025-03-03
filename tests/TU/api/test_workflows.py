import pytest
from api.models import Workflow

WORKFLOW_URL = '/api/v1/workflows'


@pytest.fixture
def mock_workflow():
    """Mock workflow object."""
    return Workflow(id="123", name="Test Workflow", steps=[{"step": "Start"}], created_by="test_user")


def test_create_workflow(client, mocker, mock_workflow, headers):
    """Test POST /workflows - Create a workflow."""
    mocker.patch("api.routes.v1.workflows.WorkflowSchema.load", return_value=mock_workflow)
    mocker.patch("api.routes.v1.workflows.db.session.add")
    mocker.patch("api.routes.v1.workflows.db.session.commit")

    response = client.post(
        WORKFLOW_URL,
        json={"name": "Test Workflow", "steps": [{"step": "Start"}]},
        headers=headers
    )
    print(response.json)
    assert response.status_code == 201
    assert response.json == {
        "id": "123",
        "name": "Test Workflow",
        "created_by": "test_user",
    }


def test_get_workflows(client, mocker, mock_workflow, headers):
    """Test GET /workflows - Retrieve all workflows."""
    mocker.patch("api.routes.v1.workflows.Workflow.query.all", return_value=[mock_workflow])

    response = client.get(
        WORKFLOW_URL,
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json == [
        {
            "id": "123",
            "name": "Test Workflow",
            "steps": [{"step": "Start"}],
            "created_by": "test_user",
            "created_at": None,
        }
    ]


def test_delete_workflow(client, mocker, mock_workflow, headers):
    """Test DELETE /workflows/<workflow_id> - Delete a workflow."""
    mock_query = mocker.patch("api.routes.v1.workflows.Workflow.query.get", return_value=mock_workflow)
    mock_delete = mocker.patch("api.routes.v1.workflows.db.session.delete")
    mock_commit = mocker.patch("api.routes.v1.workflows.db.session.commit")

    response = client.delete(
        f"{WORKFLOW_URL}/123",
        headers=headers,
    )

    mock_query.assert_called_once_with("123")
    mock_delete.assert_called_once_with(mock_workflow)
    mock_commit.assert_called_once()

    assert response.status_code == 200
    assert response.json == {"message": "Workflow deleted successfully"}


def test_delete_workflow_not_found(client, mocker, headers):
    """Test DELETE /workflows/<workflow_id> when workflow does not exist."""
    mocker.patch("api.routes.v1.workflows.Workflow.query.get", return_value=None)

    response = client.delete(
        f'{WORKFLOW_URL}/999',
        headers=headers
    )

    assert response.status_code == 404
    assert response.json == {"error": "Workflow not found"}
