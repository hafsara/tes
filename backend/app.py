from flask import Flask
from config import Config
from extensions import db
from routes import api
from flask_swagger_ui import get_swaggerui_blueprint
from auth import setup_oauth, auth_bp
from celery_app import celery
from flask_cors import CORS

app = Flask(__name__)

CORS(app)
app.config.from_object(Config)

# Initialize extensions
db.init_app(app)
setup_oauth(app)

# Enregistrer les blueprints
app.register_blueprint(api)
app.register_blueprint(auth_bp, url_prefix='/auth')

# Swagger setup
SWAGGER_URL = Config.SWAGGER_URL
API_URL = '/static/swagger.json'
swaggerui_blueprint = get_swaggerui_blueprint(SWAGGER_URL, API_URL, config={'app_name': "Form Management API"})
app.register_blueprint(swaggerui_blueprint, url_prefix=SWAGGER_URL)

if __name__ == "__main__":
    app.run(debug=True)
