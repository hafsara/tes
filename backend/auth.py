from authlib.integrations.flask_client import OAuth
from flask import redirect, url_for, session

oauth = OAuth()


def setup_oauth(app):
    oauth.init_app(app)
    oauth.register(
        name='google',
        client_id='YOUR_CLIENT_ID',  # Remplacez par votre client_id
        client_secret='YOUR_CLIENT_SECRET',  # Remplacez par votre client_secret
        access_token_url='https://accounts.google.com/o/oauth2/token',
        authorize_url='https://accounts.google.com/o/oauth2/auth',
        client_kwargs={'scope': 'openid email profile'},
    )


@app.route('/login')
def login():
    redirect_uri = url_for('authorize', _external=True)
    return oauth.google.authorize_redirect(redirect_uri)


@app.route('/authorize')
def authorize():
    token = oauth.google.authorize_access_token()
    user_info = oauth.google.parse_id_token(token)
    # Stocker les informations de l'utilisateur dans la session ou la base de données
    session['user'] = user_info
    return redirect('/')


@app.route('/logout')
def logout():
    session.pop('user', None)
    return redirect('/')
