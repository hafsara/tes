from flask import Flask
from config import Config
from models import db
from routes import api
from tasks import make_celery
from flask_swagger_ui import get_swaggerui_blueprint
from auth import setup_oauth

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
