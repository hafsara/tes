from authlib.integrations.flask_client import OAuth
from flask import Blueprint, redirect, url_for, session

# Créer un blueprint pour l'authentification
auth_bp = Blueprint('auth', __name__)

# Configurer OAuth
oauth = OAuth()

def setup_oauth(app):
    oauth.init_app(app)
    oauth.register(
        name='google',
        client_id='YOUR_CLIENT_ID',
        client_secret='YOUR_CLIENT_SECRET',
        access_token_url='https://accounts.google.com/o/oauth2/token',
        authorize_url='https://accounts.google.com/o/oauth2/auth',
        client_kwargs={'scope': 'openid email profile'},
    )

# Définir les routes de l'authentification sur le blueprint
@auth_bp.route('/login')
def login():
    redirect_uri = url_for('auth.authorize', _external=True)
    return oauth.google.authorize_redirect(redirect_uri)

@auth_bp.route('/authorize')
def authorize():
    token = oauth.google.authorize_access_token()
    user_info = oauth.google.parse_id_token(token)
    session['user'] = user_info
    return redirect('/')

@auth_bp.route('/logout')
def logout():
    session.pop('user', None)
    return redirect('/')
