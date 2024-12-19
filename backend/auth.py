from datetime import datetime, timedelta

import jwt
import requests
from flask import Blueprint, request, jsonify, redirect, url_for, session

# Création du Blueprint
auth_bp = Blueprint('auth', __name__)

# Route pour démarrer l'authentification
@auth_bp.route('/login')
def login():
    """
    Redirige l'utilisateur vers le fournisseur OAuth2 pour authentification.
    """
    redirect_uri = url_for('auth.callback', _external=True)
    return redirect(redirect_uri)


# Route callback après authentification
@auth_bp.route('/callback')
def callback():
    return_url = request.args.get('returnUrl', '/')

    user_info = {"name": "hafsa raii","email": "hafsaraii1@gmail", "sub": "d1234"}
    token_data = {
        "access_token":"access token",
        "expires_in": 1800,
        "id_token": "id token id token",
        "token_type": "Bearer"
    }
    jwt_payload = {
        "sso_token": "generated_sso_token",  # Exemple de token
        "sub": user_info['sub'],       # ID unique
        "username": user_info['name'],
        "avatar": user_info['name'],
        "exp": datetime.utcnow() + timedelta(seconds=token_data['expires_in']),  # Expiration
        "iat": datetime.utcnow(),      # Date d'émission
    }
    jwt_token = jwt.encode(jwt_payload,'your_secret_key', algorithm='HS256')

    user_info = {
        "sub": "HAFSA",
        "username": "Hafsa RAII",
        "avatar": "HR",
        "sso_token": "generated_sso_token",  # Exemple de token
    }
    return jsonify(user_info), 201
