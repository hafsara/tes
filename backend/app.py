from flask import Flask

from auth import (auth_bp)
from api.models import Application
from config import Config
from extensions import db
from flask_migrate import Migrate
from api.routes import api
from flask_swagger_ui import get_swaggerui_blueprint
from flask_cors import CORS

app = Flask(__name__, static_folder='api/static')
CORS(app)

app.config.from_object(Config)

db.init_app(app)
migrate = Migrate(app, db)

app.register_blueprint(api)
app.register_blueprint(auth_bp, url_prefix='/auth')

# Swagger setup
SWAGGER_URL = Config.SWAGGER_URL
API_URL = '/static/swagger.json'
swaggerui_blueprint = get_swaggerui_blueprint(SWAGGER_URL, API_URL)
app.register_blueprint(swaggerui_blueprint, url_prefix=SWAGGER_URL)

with app.app_context():
    # Vérifier si l'application Admin existe déjà
    admin_app = Application.query.filter_by(id='admin-test').first()
    if not admin_app:
        print("🚀 Première installation : création de l'application Admin")
        new_admin_app = Application(id='admin-test', name="admin", created_by="system")
        db.session.add(new_admin_app)
        db.session.commit()
        print("✅ Application Admin créée avec succès")

if __name__ == "__main__":
    app.run(debug=True)
