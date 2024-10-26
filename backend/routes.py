from flask import Blueprint, jsonify, request
from models import db, User, FormContainer, Form

api = Blueprint('api', __name__)


@api.route('/', methods=['GET'])
def home():
    return jsonify({"message": "Welcome to the Form Management API"}), 200


@api.route('/form-containers', methods=['POST'])
def create_form_container():
    try:
        data = request.json
        form_container = FormContainer(
            title=data['title'],
            user_id=data['user_id'],
            manager_email=data['manager_email'],
            ticket=data.get('ticket'),
            escalation=data.get('escalation', False)
        )
        db.session.add(form_container)
        db.session.commit()
        return jsonify({"id": form_container.id}), 201
    except Exception as e:
        print("Erreur:", e)  # Imprime l'erreur dans la console pour le débogage
        return jsonify({"error": str(e)}), 500


@api.route('/form-containers', methods=['GET'])
def get_form_containers():
    containers = FormContainer.query.all()
    return jsonify([{"id": c.id, "title": c.title} for c in containers]), 200
