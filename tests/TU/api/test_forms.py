import pytest
from api.extensions import db
from api.models import FormContainer, Form, Response, Question, Application


@pytest.fixture
def form_container():
    """
    Crée un FormContainer factice.
    """
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
    """
    Crée un formulaire factice attaché à un FormContainer.
    """
    test_form = Form(
        form_container_id=form_container.id,
        status="open"
    )
    db.session.add(test_form)
    db.session.commit()
    return test_form


@pytest.fixture
def question(form):
    """
    Crée une question factice liée au formulaire.
    """
    test_question = Question(
        form_id=form.id,
        label="Test Question",
        type="text"
    )
    db.session.add(test_question)
    db.session.commit()
    return test_question

@pytest.fixture
def application():
    """
    Crée une question factice liée au formulaire.
    """
    test_app = Application(id=1, name="test_app", created_by="user-test", mail_sender='test-app@exemple.com')
    db.session.add(test_app)
    db.session.commit()
    return test_app


# 1️⃣ **Test récupération d'un formulaire par ID**
def test_get_form_by_id(client, headers, form):
    response = client.get(f"/api/v1/forms/{form.id}?app_id=valid_app_id", headers=headers)
    assert response.status_code == 200
    data = response.get_json()
    assert "id" in data
    assert data["id"] == form.id


# 2️⃣ **Test soumission de réponse à un formulaire**
def test_submit_form_response(client, headers, form_container, form, question, application):
    payload = {
        "access_token": form_container.access_token,
        "questions": [
            {"id": question.id, "response": "Test Answer"}
        ]
    }
    response = client.post(f"/api/v1/forms/{form.id}/submit-response", json=payload, headers=headers)

    assert response.status_code == 200
    data = response.get_json()
    assert data["message"] == "Response submitted successfully"

    updated_form = Form.query.get(form.id)
    assert updated_form.status == "answered"

    response_record = Response.query.filter_by(form_id=form.id).first()
    assert response_record is not None
    assert response_record.answers[0]["response"] == "Test Answer"


# 3️⃣ **Test soumission de réponse sans authentification**
def test_submit_response_without_auth(client, form_container, form, question):
    payload = {
        "access_token": form_container.access_token,
        "questions": [
            {"id": question.id, "response": "Test Answer"}
        ]
    }

    response = client.post(f"/api/v1/forms/{form.id}/submit-response", json=payload)

    assert response.status_code == 401
    assert response.get_json()["error"] == "User not authenticated"


# 4️⃣ **Test soumission de réponse pour un formulaire déjà répondu**
def test_submit_response_already_answered(client, headers, form_container, form, question):
    form.status = "answered"
    db.session.commit()

    payload = {
        "access_token": form_container.access_token,
        "questions": [
            {"id": question.id, "response": "Test Answer"}
        ]
    }
    response = client.post(f"/api/v1/forms/{form.id}/submit-response", json=payload, headers=headers)
    assert response.status_code == 401
    assert response.get_json()["error"] == "Form already answered"


# 5️⃣ **Test soumission de réponse pour un FormContainer déjà validé**
def test_submit_response_already_validated(client, headers, form_container, form, question):
    form_container.validated = True
    db.session.commit()

    payload = {
        "access_token": form_container.access_token,
        "questions": [
            {"id": question.id, "response": "Test Answer"}
        ]
    }

    response = client.post(f"/api/v1/forms/{form.id}/submit-response", json=payload, headers=headers)

    assert response.status_code == 401
    assert response.get_json()["error"] == "Form container already validated"


# 6️⃣ **Test soumission de réponse avec un token d'accès invalide**
def test_submit_response_invalid_access_token(client, headers, form, question):
    payload = {
        "access_token": "invalid_access_token",
        "questions": [
            {"id": question.id, "response": "Test Answer"}
        ]
    }

    response = client.post(f"/api/v1/forms/{form.id}/submit-response", json=payload, headers=headers)

    assert response.status_code == 404


# 7️⃣ **Test soumission de réponse avec une question inexistante**
def test_submit_response_invalid_question(client, headers, form_container, form):
    payload = {
        "access_token": form_container.access_token,
        "questions": [
            {"id": 9999, "response": "Invalid Question"}
        ]
    }

    response = client.post(f"/api/v1/forms/{form.id}/submit-response", json=payload, headers=headers)

    assert response.status_code == 404


# 8️⃣ **Test soumission de réponse avec un formulaire inexistant**
def test_submit_response_invalid_form(client, headers, form_container):
    payload = {
        "access_token": form_container.access_token,
        "questions": [
            {"id": 1, "response": "Some Answer"}
        ]
    }

    response = client.post("/api/v1/forms/9999/submit-response", json=payload, headers=headers)

    assert response.status_code == 404
