from flask import Flask

from api.models import Application
from config import Config
from api.extensions import db
from flask_migrate import Migrate
from flask_swagger_ui import get_swaggerui_blueprint
from flask_cors import CORS

from api.routess.v1 import api_v1
from api.routess.v1.auth import (auth_bp)

def create_app(class_config=Config):
    app = Flask(__name__)
    CORS(app)

    app.config.from_object(class_config)
    # app.url_map.strict_slashes = False
    db.init_app(app)
    migrate = Migrate(app, db)

    app.register_blueprint(api_v1)
    app.register_blueprint(auth_bp)

    # Swagger setup
    SWAGGER_URL = class_config.SWAGGER_URL
    API_URL = '/static/swagger.yml'
    swaggerui_blueprint = get_swaggerui_blueprint(SWAGGER_URL, API_URL)
    app.register_blueprint(swaggerui_blueprint, url_prefix=SWAGGER_URL)

    return app


