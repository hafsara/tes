from api.app import create_app
from api.helpers.tools import ensure_admin_application_exists
from api.extensions import db

app = create_app()

with app.app_context():
    db.create_all()

    ensure_admin_application_exists()

if __name__ == "__main__":
    app.run(debug=True)
