import jwt
import pytest
from datetime import datetime, timedelta
from config import Config

from api.app import create_app
from api.extensions import db
from flask import request
from flask_mail import Mail


@pytest.fixture
def app():
    """
    Configure an instance of the Flask application for testing.
    """
    conf = {
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        "SQLALCHEMY_TRACK_MODIFICATIONS": False,
        "MAIL_SUPPRESS_SEND": True
    }
    app = create_app()
    app.config.update({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        "SQLALCHEMY_TRACK_MODIFICATIONS": False,
        "MAIL_SUPPRESS_SEND": True
    })
    mail = Mail(app)
    mail.init_app(app)

    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    """
    Returns a test Flask client.
    """
    return app.test_client()


@pytest.fixture
def headers():
    """
    Génère un token JWT utilisateur valide.
    """
    secret_key = Config.SECRET_KEY
    payload = {
        "sub": "test_user",
        "exp": datetime.utcnow() + timedelta(hours=1)
    }
    token = jwt.encode(payload, secret_key, algorithm="HS256")

    return {"Authorization": f"Bearer {token}"}


def verify_token():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    print(f"Token reçu: {token}")
