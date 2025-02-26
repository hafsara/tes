from flask import Flask
from config import Config
from api.extensions import db, migrate, cors, mail
from flask_swagger_ui import get_swaggerui_blueprint


from api.routes.v1 import api_v1
from api.routes.v1.auth import auth_bp

def create_app(class_config=Config):
    app = Flask(__name__)
    app.secret_key = class_config.SECRET_KEY
    app.config.from_object(class_config)

    # app.url_map.strict_slashes = False
    db.init_app(app)
    migrate.init_app(app, db)
    cors.init_app(app)
    mail.init_app(app)

    app.register_blueprint(api_v1)
    app.register_blueprint(auth_bp)

    # Swagger setup
    SWAGGER_URL = class_config.SWAGGER_URL
    API_URL = '/static/swagger.yml'
    swaggerui_blueprint = get_swaggerui_blueprint(SWAGGER_URL, API_URL)
    app.register_blueprint(swaggerui_blueprint, url_prefix=SWAGGER_URL)

    return app


