from flask import Blueprint
# Import each route file
from api.routess.v1.application import application_bp
from api.routess.v1.campaign import campaign_bp
from api.routess.v1.form import form_bp
from api.routess.v1.api_token import api_token_bp
from api.routess.v1.form_container import form_container_bp
from api.routess.auth_decorators import authenticate_request


api_v1 = Blueprint('api_v1', __name__, url_prefix='/api/v1')

@api_v1.before_request
def before_request():
    return authenticate_request()


# Register blueprints
api_v1.register_blueprint(application_bp)
api_v1.register_blueprint(campaign_bp)
api_v1.register_blueprint(form_container_bp)
api_v1.register_blueprint(form_bp)
api_v1.register_blueprint(api_token_bp)
