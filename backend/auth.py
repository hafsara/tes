# auth.py
from authlib.integrations.flask_client import OAuth
from flask import Blueprint, redirect, url_for, session
from models import db, SuperAdmin

oauth = OAuth()

auth_bp = Blueprint('auth', __name__)

# Configurez le fournisseur OAuth ici
oauth.init_app(auth_bp)


@auth_bp.route('/login')
def login():
    redirect_uri = url_for('auth.auth_callback', _external=True)
    return oauth.provider.authorize_redirect(redirect_uri)


@auth_bp.route('/auth/callback')
def auth_callback():
    token = oauth.provider.authorize_access_token()
    user_info = oauth.provider.userinfo()

    super_admin = SuperAdmin.query.filter_by(email=user_info['email']).first()
    if not super_admin:
        return "Accès refusé : Vous n'êtes pas autorisé", 403

    session['super_admin_id'] = super_admin.id
    return redirect(url_for('home'))
