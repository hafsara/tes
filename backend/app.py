from flask import Flask
from config import Config
from extensions import db
from flask_migrate import Migrate
from api.routes import api
from flask_swagger_ui import get_swaggerui_blueprint
from auth import setup_oauth, auth_bp
from flask_cors import CORS

app = Flask(__name__, static_folder='api/static')
# todo configure CORS
CORS(app)
app.config.from_object(Config)

db.init_app(app)
migrate = Migrate(app, db)
setup_oauth(app)

app.register_blueprint(api)
app.register_blueprint(auth_bp, url_prefix='/auth')

# Swagger setup
SWAGGER_URL = Config.SWAGGER_URL
API_URL = '/static/swagger.json'
swaggerui_blueprint = get_swaggerui_blueprint(SWAGGER_URL, API_URL)
app.register_blueprint(swaggerui_blueprint, url_prefix=SWAGGER_URL)

if __name__ == "__main__":
    app.run(debug=True)
