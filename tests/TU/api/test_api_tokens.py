from datetime import datetime, timedelta

import pytest
from api.models import APIToken


@pytest.fixture
def new_api_token():
    """
    Fixture for an example API token.
    """
    return {
        "app_names": ["Test App"],
        "token_name": "TestToken",
        "expiration": (datetime.utcnow() + timedelta(days=7)).isoformat()
    }


@pytest.fixture
def created_api_token(client, headers, new_api_token):
    """
    Create API token before testing.
    """
    response = client.post("/api/v1/api-tokens", json=new_api_token, headers=headers)
    return response.get_json()


@pytest.fixture
def token_id(created_api_token):
    """
    Retrieves the ID of the created API token.
    """
    return created_api_token["token"]


def test_generate_api_token(client, headers, new_api_token):
    response = client.post("/api/v1/api-tokens", json=new_api_token, headers=headers)
    data = response.get_json()

    assert response.status_code == 201
    assert "token" in data
    assert data["token_name"] == new_api_token["token_name"]

    api_token = APIToken.query.filter_by(token=data["token"]).first()
    assert api_token is not None
    assert api_token.token_name == new_api_token["token_name"]
    assert api_token.app_names == new_api_token["app_names"]


def test_revoke_api_token(client, headers, token_id):
    response = client.delete(f"/api/v1/api-tokens/{token_id}", headers=headers)
    assert response.status_code == 200
    assert response.get_json()["message"] == "API token revoked successfully"

    revoked_token = APIToken.query.filter_by(token=token_id).first()
    assert revoked_token is None


def test_get_api_tokens(client, headers):
    response = client.get("/api/v1/api-tokens", headers=headers)
    assert response.status_code == 200

    data = response.get_json()
    assert isinstance(data, list)


def test_rotate_api_token(client, headers, created_api_token):
    rotate_data = {"token_name": created_api_token["token_name"]}

    response = client.put("/api/v1/api-tokens/rotate", json=rotate_data, headers=headers)
    data = response.get_json()

    assert response.status_code == 200
    assert "new_token" in data

    rotated_token = APIToken.query.filter_by(token_name=created_api_token["token_name"]).first()
    assert rotated_token is not None
    assert rotated_token.token != created_api_token["token"]


def test_revoke_nonexistent_api_token(client, headers):
    response = client.delete("/api/v1/api-tokens/invalid_token", headers=headers)
    assert response.status_code == 404
    assert response.get_json()["error"] == "Token not found"


def test_access_without_auth(client):
    response = client.get("/api/v1/api-tokens")
    assert response.status_code == 401
    assert response.get_json()["error"] == "User not authenticated"


def test_rotate_nonexistent_api_token(client, headers):
    rotate_data = {"token_name": "NonExistentToken"}

    response = client.put("/api/v1/api-tokens/rotate", json=rotate_data, headers=headers)
    assert response.status_code == 404
    assert response.get_json()["error"] == "Token not found"
