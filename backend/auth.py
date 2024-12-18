from flask import Blueprint, redirect, session, url_for, jsonify
from flask_pyoidc import OIDCAuthentication
from flask_pyoidc.provider_configuration import ProviderConfiguration

# Création du Blueprint pour les routes d'authentification
auth_bp = Blueprint('auth', __name__)

# Configuration du fournisseur OAuth2
provider_metadata = {
    "issuer": "https://accounts.google.com",  # URL de ton fournisseur OAuth2 (Google ici)
    "authorization_endpoint": "https://accounts.google.com/o/oauth2/auth",
    "token_endpoint": "https://accounts.google.com/o/oauth2/token",
    "userinfo_endpoint": "https://www.googleapis.com/oauth2/v1/userinfo",
}

provider_config = ProviderConfiguration(
    issuer=provider_metadata['issuer'],
    client_id='YOUR_CLIENT_ID',  # Remplace par ton client_id
    client_secret='YOUR_CLIENT_SECRET',  # Remplace par ton client_secret
    redirect_uri='http://localhost:5000/auth/callback',  # Doit correspondre à l'URI configurée côté fournisseur
    provider_metadata=provider_metadata
)

# Initialisation de PyOIDC
auth = OIDCAuthentication({'default': provider_config})


# Route pour démarrer l'authentification
@auth_bp.route('/login')
@auth.oidc_auth('default')
def login():
    """
    Cette route démarre le processus d'authentification.
    PyOIDC redirige automatiquement vers le fournisseur OAuth2.
    Une fois authentifié, l'utilisateur est redirigé vers la route /auth/callback.
    """
    return redirect(url_for('auth.protected'))


# Route de callback après authentification réussie
@auth_bp.route('/callback')
@auth.oidc_auth('default')
def callback():
    """
    Cette route est appelée après que le fournisseur OAuth2 redirige l'utilisateur.
    PyOIDC gère automatiquement la récupération du code d'autorisation,
    l'échange contre un Access Token, et le stockage des informations utilisateur.
    """
    # Récupérer les informations utilisateur depuis la session
    userinfo = session.get('user')

    # Sauvegarder les informations utilisateur dans la session (facultatif)
    session['user_info'] = userinfo

    # Rediriger vers une route protégée ou la page d'accueil
    return redirect(url_for('auth.protected'))


# Route protégée accessible uniquement aux utilisateurs authentifiés
@auth_bp.route('/protected')
@auth.oidc_auth('default')
def protected():
    """
    Exemple de route protégée. Accessible uniquement après authentification.
    """
    # Récupérer les informations utilisateur depuis la session
    user_info = session.get('user')
    return jsonify({
        "message": "Accès autorisé",
        "user_info": user_info
    })


# Route pour déconnexion
@auth_bp.route('/logout')
def logout():
    """
    Déconnecte l'utilisateur en effaçant la session locale.
    """
    session.clear()  # Efface la session Flask
    return redirect(url_for('auth.login'))  # Redirige vers la page de connexion
