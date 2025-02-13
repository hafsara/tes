from flask import Flask

from backend.api.auth import (auth_bp)
from backend.api.models import Application
from backend.config import Config
from backend.api.extensions import db
from flask_migrate import Migrate
from backend.api.routes import api
from flask_swagger_ui import get_swaggerui_blueprint
from flask_cors import CORS

def create_app(class_config=Config):
    app = Flask(__name__)
    CORS(app)

    app.config.from_object(Config)

    db.init_app(app)
    migrate = Migrate(app, db)

    app.register_blueprint(api)
    app.register_blueprint(auth_bp, url_prefix='/auth')

    # Swagger setup
    SWAGGER_URL = Config.SWAGGER_URL
    API_URL = '/static/swaggerr.yml'
    swaggerui_blueprint = get_swaggerui_blueprint(SWAGGER_URL, API_URL)
    app.register_blueprint(swaggerui_blueprint, url_prefix=SWAGGER_URL)

    with app.app_context():
        # Vérifier si l'application Admin existe déjà
        admin_app = Application.query.filter_by(id='admin-test').first()
        if not admin_app:
            new_admin_app = Application(id='admin-test', name="admin", created_by="system")
            db.session.add(new_admin_app)
            db.session.commit()
    return app


