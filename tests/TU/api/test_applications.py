import pytest
from api.models import Application, ConnectionLog


@pytest.fixture
def new_application():
    """
    Fixture pour un exemple d'application.
    """
    return {
        "name": "Test Application",
        "mail_sender": "test@example.com"
    }


@pytest.fixture
def created_application(client, headers, new_application):
    """
    Crée une application avant les tests.
    """
    response = client.post("/api/v1/applications", json=new_application, headers=headers)
    return response.get_json()


@pytest.fixture
def app_id(created_application):
    """
    Récupère l'ID de l'application créée.
    """
    return created_application["app_id"]


@pytest.fixture
def connection_log_payload():
    """
    Fixture pour les logs de connexion.
    """
    return {"app_ids": ["app_id_1", "app_id_2"]}


# 1 **Test de création d'application**
def test_create_application(client, headers, new_application):
    response = client.post("/api/v1/applications", json=new_application, headers=headers)
    data = response.get_json()

    assert response.status_code == 201
    assert "message" in data
    assert "app_id" in data

    app = Application.query.filter_by(id=data["app_id"]).first()
    assert app is not None
    assert app.name == new_application["name"]
    assert app.mail_sender == new_application["mail_sender"]


# 2 **Test de récupération des applications**
def test_get_applications(client, headers):
    response = client.get("/api/v1/applications", headers=headers)
    assert response.status_code == 200

    data = response.get_json()
    assert isinstance(data, list)


# 3 **Test de mise à jour d'une application**
def test_update_application(client, headers, app_id):
    updated_data = {
        "name": "Updated Application",
        "new_mail_sender": "updated@example.com",
        "generate_new_id": False
    }

    response = client.put(f"/api/v1/applications/{app_id}", json=updated_data, headers=headers)
    assert response.status_code == 200

    data = response.get_json()
    assert data["message"] == "Application updated successfully"

    updated_app = Application.query.get(app_id)
    assert updated_app.name == "Updated Application"
    assert updated_app.mail_sender == "updated@example.com"


# 4 **Test de mise à jour avec `generate_new_id=True`**
def test_update_application_generate_new_id(client, headers, app_id):
    updated_data = {
        "generate_new_id": True
    }

    response = client.put(f"/api/v1/applications/{app_id}", json=updated_data, headers=headers)
    assert response.status_code == 200

    data = response.get_json()
    assert "app_token" in data

    new_app = Application.query.get(data["app_token"])
    assert new_app is not None


# 5 **Test de log de connexion**
def test_log_connection(client, headers, connection_log_payload):
    response = client.post("/api/v1/applications/log-connection", json=connection_log_payload, headers=headers)
    assert response.status_code == 201

    data = response.get_json()
    assert data["message"] == "Connection log added successfully"

    log = ConnectionLog.query.filter_by(app_ids=connection_log_payload["app_ids"]).first()
    assert log is not None


# 6 **Test de validation de token d'application**
def test_validate_token(client, headers, app_id):
    response = client.get(f"/api/v1/applications/validate-token/{app_id}", headers=headers)
    assert response.status_code in [200, 401]

    data = response.get_json()
    assert "is_valid" in data
    assert "token" in data
