from flask import Blueprint, redirect, session, url_for, request, jsonify
from flask_pyoidc import OIDCAuthentication
from flask_pyoidc.provider_configuration import ProviderConfiguration
from authlib.oauth2.rfc6749.errors import InvalidGrantError

# Création du Blueprint pour les routes SSO
auth_bp = Blueprint('auth', __name__)

# Configuration du fournisseur OAuth2/SSO
provider_metadata = {
    "issuer": "https://accounts.google.com",  # Fournisseur OAuth2 (Google ici)
    "authorization_endpoint": "https://accounts.google.com/o/oauth2/auth",
    "token_endpoint": "https://accounts.google.com/o/oauth2/token",
    "userinfo_endpoint": "https://www.googleapis.com/oauth2/v1/userinfo",
}

provider_config = ProviderConfiguration(
    issuer=provider_metadata['issuer'],
    client_id='YOUR_CLIENT_ID',  # Remplace par ton Client ID
    client_secret='YOUR_CLIENT_SECRET',  # Remplace par ton Client Secret
    redirect_uri='http://localhost:5000/auth/callback',  # URL de retour configurée
    provider_metadata=provider_metadata
)

# Initialisation PyOIDC
auth = OIDCAuthentication({'default': provider_config})


# Route pour démarrer l'authentification
@auth_bp.route('/login')
@auth.oidc_auth('default')
def login():
    """
    Démarre le processus SSO.
    L'utilisateur est redirigé vers le fournisseur OAuth2.
    """
    return redirect(url_for('auth.callback'))


# Route callback après authentification
@auth_bp.route('/callback')
def callback():
    """
    Gère le callback après redirection depuis le fournisseur.
    Échange le code d'autorisation contre un Access Token.
    """
    # Récupérer les paramètres depuis l'URL
    authorization_code = request.args.get('code')  # Le code d'autorisation
    state = request.args.get('state')  # État de sécurité, validé automatiquement par PyOIDC

    if not authorization_code:
        return "Erreur : Aucun code d'autorisation reçu.", 400

    # Échanger le code contre un Access Token
    try:
        token = auth.clients['default'].fetch_token(
            provider_metadata['token_endpoint'],
            grant_type='authorization_code',
            code=authorization_code,
            redirect_uri=provider_config.redirect_uri,
            client_id=provider_config.client_id,
            client_secret=provider_config.client_secret,
        )
    except InvalidGrantError as e:
        return f"Erreur lors de l'échange du token : {str(e)}", 400

    # Stocker les informations utilisateur dans la session
    session['access_token'] = token['access_token']
    session['id_token'] = token.get('id_token')  # Si disponible
    session['expires_in'] = token['expires_in']

    # Récupérer les informations utilisateur avec le token
    user_info = auth.clients['default'].userinfo(token['access_token'])
    session['user_info'] = user_info

    return redirect(url_for('auth.protected'))


# Route protégée
@auth_bp.route('/protected')
def protected():
    """
    Exemple de route protégée, accessible uniquement après authentification.
    """
    if 'access_token' not in session:
        return redirect(url_for('auth.login'))

    user_info = session.get('user_info')
    return jsonify({
        "message": "Accès autorisé",
        "user_info": user_info,
        "access_token": session['access_token']
    })


# Route de déconnexion
@auth_bp.route('/logout')
def logout():
    """
    Déconnecte l'utilisateur en effaçant la session locale.
    """
    session.clear()
    return redirect(url_for('auth.login'))
