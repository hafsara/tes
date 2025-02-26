from flask_cors import CORS
from flask_migrate import Migrate
from flask_pyoidc import OIDCAuthentication
from flask_pyoidc.provider_configuration import ProviderConfiguration, ClientMetadata
from flask_sqlalchemy import SQLAlchemy
from flask_mail import Mail

from config import Config

db = SQLAlchemy()
mail = Mail()
cors = CORS()
migrate = Migrate()

provider_config = ProviderConfiguration(
    issuer=Config.OAUTH_PROVIDER,
    auth_request_params={
        'scope': ['openid', 'profile', 'email'],
        'response_type': ['code']
    },
    client_metadata=ClientMetadata(client_id=Config.OAUTH_CLIENT_ID, client_secret=Config.OAUTH_CLIENT_SECRET)
)

auth = OIDCAuthentication({'default': provider_config})
