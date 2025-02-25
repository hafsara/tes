import pytest
from api.models import Campaign


@pytest.fixture
def new_campaign():
    """
    Fixture pour une campagne valide.
    """
    return {
        "name": "Test Campaign",
        "app_id": "valid_app_id"
    }


@pytest.fixture
def created_campaign(client, headers, new_campaign):
    """
    Crée une campagne avant les tests.
    """
    response = client.post("/api/v1/campaigns", json=new_campaign, headers=headers)
    return response.get_json()


@pytest.fixture
def campaign_id(created_campaign):
    """
    Récupère l'ID de la campagne créée.
    """
    return created_campaign["campaign_id"]


# 1️⃣ **Test de création d’une campagne**
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


# 2️⃣ **Test de récupération des campagnes**
def test_get_campaigns(client, headers, new_campaign):
    client.post("/api/v1/campaigns", json=new_campaign, headers=headers)

    response = client.get(f"/api/v1/campaigns/{new_campaign['app_id']}", headers=headers)
    assert response.status_code == 200

    data = response.get_json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert data[0]["name"] == new_campaign["name"]


# 3️⃣ **Test de mise à jour d’une campagne**
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


# 6️⃣ **Test récupération d’une campagne avec un app_id invalide**
def test_get_campaigns_invalid_app_id(client, headers):
    response = client.get("/api/v1/campaigns/invalid_app_id", headers=headers)
    assert response.status_code == 200
    assert response.get_json() == []


# 7️⃣ **Test accès sans authentification (`401 Unauthorized`)**
def test_access_without_auth(client):
    response = client.post("/api/v1/campaigns", json={"name": "Test Campaign", "app_id": "valid_app_id"})
    assert response.status_code == 401
    assert response.get_json()["error"] == "User not authenticated"


# 8️⃣ **Test mise à jour d’une campagne avec un app_id invalide**
def test_update_campaign_invalid_app_id(client, headers, campaign_id):
    updated_data = {
        "app_id": "invalid_app_id",
        "name": "Invalid Update"
    }

    response = client.put(f"/api/v1/campaigns/{campaign_id}", json=updated_data, headers=headers)
    assert response.status_code == 404


# 9️⃣ **Test création de campagne avec un app_id manquant**
def test_create_campaign_missing_app_id(client, headers):
    campaign_data = {
        "name": "Campaign Without App ID"
    }

    response = client.post("/api/v1/campaigns", json=campaign_data, headers=headers)
    assert response.status_code == 400
    assert "app_id" in response.get_json()["error"]


# 🔟 **Test mise à jour d’une campagne inexistante**
def test_update_nonexistent_campaign(client, headers):
    updated_data = {
        "app_id": "valid_app_id",
        "name": "Nonexistent Campaign"
    }
    response = client.put("/api/v1/campaigns/99999", json=updated_data, headers=headers)
    assert response.status_code == 404
