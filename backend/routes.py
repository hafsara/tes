from flask import Blueprint, jsonify, request
from models import db, User, FormContainer, Form

api = Blueprint('api', __name__)

@api.route('/', methods=['GET'])
def home():
    return jsonify({"message": "Welcome to the Form Management API"}), 200

@api.route('/form-containers', methods=['POST'])
def create_form_container():
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
    return jsonify(form_container.id), 201

@api.route('/form-containers/<int:container_id>/forms', methods=['POST'])
def create_form(container_id):
    data = request.json
    form = Form(form_container_id=container_id, fields=data['fields'])
    db.session.add(form)
    db.session.commit()
    return jsonify(form.id), 201
