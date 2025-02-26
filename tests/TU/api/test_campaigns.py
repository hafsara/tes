import pytest
from api.models import Campaign


@pytest.fixture
def new_campaign():
    """
    Fixture for a valid campaign.
    """
    return {
        "name": "Test Campaign",
        "app_id": "valid_app_id"
    }


@pytest.fixture
def created_campaign(client, headers, new_campaign):
    """
    Create a campaign before testing.
    """
    response = client.post("/api/v1/campaigns", json=new_campaign, headers=headers)
    return response.get_json()


@pytest.fixture
def campaign_id(created_campaign):
    """
    Retrieves the ID of the created campaign.
    """
    return created_campaign["campaign_id"]


def test_create_campaign(client, headers, new_campaign):
    response = client.post("/api/v1/campaigns", json=new_campaign, headers=headers)
    data = response.get_json()

    assert response.status_code == 201
    assert "campaign_id" in data
    assert data["message"] == "Campaign created successfully"

    campaign = Campaign.query.filter_by(id=data["campaign_id"]).first()
    assert campaign is not None
    assert campaign.name == new_campaign["name"]
    assert campaign.app_id == new_campaign["app_id"]


def test_get_campaigns(client, headers, new_campaign):
    client.post("/api/v1/campaigns", json=new_campaign, headers=headers)

    response = client.get(f"/api/v1/campaigns/{new_campaign['app_id']}", headers=headers)
    assert response.status_code == 200

    data = response.get_json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert data[0]["name"] == new_campaign["name"]


def test_update_campaign(client, headers, campaign_id):
    updated_data = {
        "app_id": "valid_app_id",
        "name": "Updated Campaign"
    }

    response = client.put(f"/api/v1/campaigns/{campaign_id}", json=updated_data, headers=headers)
    assert response.status_code == 200

    data = response.get_json()
    assert data["message"] == "Campaign updated successfully"

    updated_campaign = Campaign.query.get(campaign_id)
    assert updated_campaign is not None
    assert updated_campaign.name == "Updated Campaign"


def test_get_campaigns_invalid_app_id(client, headers):
    response = client.get("/api/v1/campaigns/invalid_app_id", headers=headers)
    assert response.status_code == 200
    assert response.get_json() == []


def test_access_without_auth(client):
    response = client.post("/api/v1/campaigns", json={"name": "Test Campaign", "app_id": "valid_app_id"})
    assert response.status_code == 401
    assert response.get_json()["error"] == "User not authenticated"


def test_update_campaign_invalid_app_id(client, headers, campaign_id):
    updated_data = {
        "app_id": "invalid_app_id",
        "name": "Invalid Update"
    }

    response = client.put(f"/api/v1/campaigns/{campaign_id}", json=updated_data, headers=headers)
    assert response.status_code == 404


def test_create_campaign_missing_app_id(client, headers):
    campaign_data = {
        "name": "Campaign Without App ID"
    }

    response = client.post("/api/v1/campaigns", json=campaign_data, headers=headers)
    assert response.status_code == 400
    assert "app_id" in response.get_json()["error"]


def test_update_nonexistent_campaign(client, headers):
    updated_data = {
        "app_id": "valid_app_id",
        "name": "Nonexistent Campaign"
    }
    response = client.put("/api/v1/campaigns/99999", json=updated_data, headers=headers)
    assert response.status_code == 404
