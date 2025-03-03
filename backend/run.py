from api.app import create_app
from api.helpers.tools import ensure_admin_application_exists

app = create_app()

with app.app_context():
    ensure_admin_application_exists()

if __name__ == "__main__":
    app.run(debug=True)
