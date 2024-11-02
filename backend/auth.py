# auth.py
from authlib.integrations.flask_client import OAuth
from flask import Blueprint, redirect, url_for, session
from models import db

oauth = OAuth()

auth_bp = Blueprint('auth', __name__)


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


@auth_bp.route('/login')
def login():
    redirect_uri = url_for('auth.auth_callback', _external=True)
    return oauth.provider.authorize_redirect(redirect_uri)


@auth_bp.route('/auth/callback')
def auth_callback():
    token = oauth.provider.authorize_access_token()
    user_info = oauth.provider.userinfo()

    super_admin = True
    if not super_admin:
        return "Accès refusé : Vous n'êtes pas autorisé", 403

    session['admin_id'] = super_admin.id
    return redirect(url_for('home'))
