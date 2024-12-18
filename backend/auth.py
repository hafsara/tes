import requests
from flask import Blueprint, request, jsonify, redirect, url_for, session
from flask_pyoidc.provider_configuration import ProviderConfiguration

# Configuration OAuth2
provider_metadata = {
    "issuer": "https://accounts.google.com",  # Fournisseur OAuth2
    "authorization_endpoint": "https://accounts.google.com/o/oauth2/auth",
    "token_endpoint": "https://accounts.google.com/o/oauth2/token",
    "userinfo_endpoint": "https://www.googleapis.com/oauth2/v1/userinfo",
}

provider_config = ProviderConfiguration(
    issuer=provider_metadata['issuer'],
    client_id='YOUR_CLIENT_ID',  # Ton client ID
    client_secret='YOUR_CLIENT_SECRET',  # Ton client secret
    redirect_uri='http://localhost:5000/auth/callback',  # URL de callback
    provider_metadata=provider_metadata
)

# Création du Blueprint
auth_bp = Blueprint('auth', __name__)

# Route pour démarrer l'authentification
@auth_bp.route('/login')
def login():
    """
    Redirige l'utilisateur vers le fournisseur OAuth2 pour authentification.
    """
    auth_url = (
        f"{provider_metadata['authorization_endpoint']}?"
        f"response_type=code&"
        f"client_id={provider_config.client_id}&"
        f"redirect_uri={provider_config.redirect_uri}&"
        f"scope=openid email profile&"
        f"state=xyz"
    )
    return redirect(auth_url)


# Route callback après authentification
@auth_bp.route('/callback')
def callback():
    """
    Récupère les tokens depuis le fournisseur OAuth2.
    """
    # Récupérer le code d'autorisation depuis l'URL
    authorization_code = request.args.get('code')
    if not authorization_code:
        return jsonify({"error": "Code d'autorisation manquant"}), 400

    # Échanger le code contre des tokens
    token_data = exchange_code_for_token(authorization_code)
    if "error" in token_data:
        return jsonify(token_data), 400

    # Récupérer les informations utilisateur depuis le token
    user_info = get_user_info(token_data['access_token'])

    # Stocker les informations dans la session (facultatif)
    session['user_info'] = user_info
    session['access_token'] = token_data['access_token']

    return jsonify({
        "message": "Authentification réussie",
        "user_info": user_info,
        "tokens": token_data
    })


# Fonction pour échanger le code contre des tokens
def exchange_code_for_token(authorization_code):
    """
    Envoie une requête au token endpoint pour échanger le code contre des tokens.
    """
    token_url = provider_metadata['token_endpoint']
    data = {
        "grant_type": "authorization_code",
        "code": authorization_code,
        "redirect_uri": provider_config.redirect_uri,
        "client_id": provider_config.client_id,
        "client_secret": provider_config.client_secret,
    }
    response = requests.post(token_url, data=data)

    if response.status_code == 200:
        return response.json()
    else:
        return {"error": "Erreur lors de l'échange du code", "details": response.json()}


# Fonction pour récupérer les informations utilisateur
def get_user_info(access_token):
    """
    Envoie une requête au userinfo endpoint pour récupérer les informations utilisateur.
    """
    userinfo_url = provider_metadata['userinfo_endpoint']
    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.get(userinfo_url, headers=headers)

    if response.status_code == 200:
        return response.json()
    else:
        return {"error": "Impossible de récupérer les informations utilisateur"}
