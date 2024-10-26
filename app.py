from flask import Flask
from backend.config import Config
from backend.models import db
from backend.routes import api
from flask_swagger_ui import get_swaggerui_blueprint
from backend.celery_config import make_celery
from backend.auth import setup_oauth


app = Flask(__name__)
app.config.from_object(Config)

# Initialize extensions
db.init_app(app)
setup_oauth(app)
celery = make_celery(app)

# Register API
app.register_blueprint(api)

# Swagger setup
SWAGGER_URL = Config.SWAGGER_URL
API_URL = '/static/swagger.json'
swaggerui_blueprint = get_swaggerui_blueprint(SWAGGER_URL, API_URL, config={'app_name': "Form Management API"})
app.register_blueprint(swaggerui_blueprint, url_prefix=SWAGGER_URL)

if __name__ == "__main__":
    app.run(debug=True)
