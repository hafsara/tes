import jwt
import pytest
from datetime import datetime, timedelta
from api.app import create_app
from api.extensions import db as _db
from flask import request, Flask
from flask_mail import Mail

from config import TestingConfig


# Create a Flask App for Testing
@pytest.fixture
def app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['TESTING'] = True

    _db.init_app(app)
    mail = Mail(app)
    mail.init_app(app)
    with app.app_context():
        _db.create_all()
        yield app
        _db.drop_all()


# Create a database session for testing
@pytest.fixture
def db_session(app):
    with app.app_context():
        yield _db.session
        _db.session.remove()

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
    secret_key = TestingConfig.SECRET_KEY
    payload = {
        "sub": "test_user",
        "exp": datetime.utcnow() + timedelta(hours=1)
    }
    token = jwt.encode(payload, secret_key, algorithm="HS256")

    return {"Authorization": f"Bearer {token}"}


def verify_token():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    print(f"Token reçu: {token}")
