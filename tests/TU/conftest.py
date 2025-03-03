import jwt
import pytest
from datetime import datetime, timedelta
from api.app import create_app
from api.extensions import db as _db
from flask import request

from config import TestConfig


@pytest.fixture
def app():
    """
    Configure an instance of the Flask application for testing.
    """
    app = create_app(TestConfig)
    yield app


@pytest.fixture
def client(app):
    """
    Returns a test Flask client.
    """
    return app.test_client()


@pytest.fixture(scope="function", autouse=True)
def app_context(app):
    """Ensure that each test runs within an application context and reinitialize the DB."""
    with app.app_context():
        _db.create_all()
        yield
        _db.session.remove()
        _db.drop_all()



@pytest.fixture
def headers():
    """
    Génère un token JWT utilisateur valide.
    """
    secret_key = TestConfig.SECRET_KEY
    payload = {
        "sub": "test_user",
        "exp": datetime.utcnow() + timedelta(hours=1)
    }
    token = jwt.encode(payload, secret_key, algorithm="HS256")

    return {"Authorization": f"Bearer {token}"}


def verify_token():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    print(f"Token reçu: {token}")

