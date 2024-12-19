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
    user_info = {"name": "Hafsa Rii","email": "hafsaraii1@gmail", "sub": "d1234"}
    token_data = {
        "access_token":"access token",
        "expires_in": 1800,
        "id_token": "id token id token",
        "token_type": "Bearer"
    }
    jwt_payload = {
        "sso_token": token_data['access_token'],
        "sub": user_info['sub'],
        "username": user_info['name'],
        "avatar": user_info['name'][:2].upper(),
        "exp": datetime.utcnow() + timedelta(seconds=token_data['expires_in'])
    }
    jwt_token = jwt.encode(jwt_payload,'your_secret_key', algorithm='HS256')
    return jsonify({
        "token": jwt_token,
    }), 201
