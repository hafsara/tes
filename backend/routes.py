# routes.py
from flask import Blueprint, jsonify, request, session
from models import db, FormContainer, Form

api = Blueprint('api', __name__)


# Endpoint pour créer un conteneur de formulaire avec au moins un formulaire
@api.route('/form-containers', methods=['POST'])
def create_form_container():
    data = request.json
    super_admin_id = session.get('super_admin_id')

    if not super_admin_id:
        return jsonify({"error": "SuperAdmin non authentifié"}), 401

    # Créer le FormContainer
    form_container = FormContainer(
        title=data['title'],
        user_email=data['user_email'],
        manager_email=data['manager_email'],
        ticket=data.get('ticket'),
        escalation=data.get('escalation', False),
        initiated_by=super_admin_id
    )

    db.session.add(form_container)
    db.session.commit()

    # Ajouter le premier formulaire au conteneur
    form_data = data.get('form')
    if not form_data:
        return jsonify({"error": "Un formulaire est requis pour créer un conteneur"}), 400

    form = Form(
        form_container_id=form_container.id,
        fields=form_data['fields']
    )
    db.session.add(form)
    db.session.commit()

    return jsonify({"container_id": form_container.id, "form_id": form.id}), 201


# Endpoint pour ajouter un formulaire supplémentaire dans un conteneur (max 5)
@api.route('/form-containers/<int:container_id>/forms', methods=['POST'])
def add_form_to_container(container_id):
    super_admin_id = session.get('super_admin_id')
    if not super_admin_id:
        return jsonify({"error": "SuperAdmin non authentifié"}), 401

    form_container = FormContainer.query.get_or_404(container_id)

    if form_container.initiated_by != super_admin_id:
        return jsonify({"error": "Vous n'êtes pas autorisé à modifier ce conteneur"}), 403

    # Vérifier le nombre de formulaires dans le conteneur
    if len(form_container.forms) >= 5:
        return jsonify({"error": "Vous ne pouvez pas ajouter plus de 5 formulaires à ce conteneur"}), 400

    data = request.json
    form = Form(
        form_container_id=container_id,
        fields=data['fields']
    )
    db.session.add(form)
    db.session.commit()

    return jsonify({"form_id": form.id}), 201


# Endpoint pour obtenir tous les conteneurs de formulaires créés par le SuperAdmin courant
@api.route('/form-containers', methods=['GET'])
def get_form_containers_by_super_admin():
    super_admin_id = session.get('super_admin_id')

    if not super_admin_id:
        return jsonify({"error": "SuperAdmin non authentifié"}), 401

    form_containers = FormContainer.query.filter_by(initiated_by=super_admin_id).all()
    result = [
        {
            "id": fc.id,
            "title": fc.title,
            "user_email": fc.user_email,
            "manager_email": fc.manager_email,
            "ticket": fc.ticket,
            "escalation": fc.escalation,
            "validated": fc.validated,
            "forms_count": len(fc.forms)
        }
        for fc in form_containers
    ]
    return jsonify(result), 200


# Endpoint pour obtenir tous les conteneurs de formulaires pour tous les SuperAdmins
@api.route('/form-containers/all', methods=['GET'])
def get_all_form_containers():
    form_containers = FormContainer.query.all()
    result = [
        {
            "id": fc.id,
            "title": fc.title,
            "user_email": fc.user_email,
            "manager_email": fc.manager_email,
            "ticket": fc.ticket,
            "escalation": fc.escalation,
            "validated": fc.validated,
            "forms_count": len(fc.forms),
            "initiated_by": fc.initiated_by
        }
        for fc in form_containers
    ]
    return jsonify(result), 200


# Endpoint pour obtenir les détails d'un conteneur de formulaire par ID
@api.route('/form-containers/<int:container_id>', methods=['GET'])
def get_form_container_by_id(container_id):
    form_container = FormContainer.query.get_or_404(container_id)
    result = {
        "id": form_container.id,
        "title": form_container.title,
        "user_email": form_container.user_email,
        "manager_email": form_container.manager_email,
        "ticket": form_container.ticket,
        "escalation": form_container.escalation,
        "validated": form_container.validated,
        "initiated_by": form_container.initiated_by,
        "forms": [
            {
                "form_id": form.id,
                "fields": form.fields,
                "response": form.response,
                "responder_id": form.responder_id,
                "status": form.status
            }
            for form in form_container.forms
        ]
    }
    return jsonify(result), 200


# Endpoint pour obtenir les conteneurs de formulaires initiés par un SuperAdmin spécifique (en utilisant son ID)
@api.route('/form-containers/super-admin/<int:super_admin_id>', methods=['GET'])
def get_form_containers_by_specific_super_admin(super_admin_id):
    form_containers = FormContainer.query.filter_by(initiated_by=super_admin_id).all()
    result = [
        {
            "id": fc.id,
            "title": fc.title,
            "user_email": fc.user_email,
            "manager_email": fc.manager_email,
            "ticket": fc.ticket,
            "escalation": fc.escalation,
            "validated": fc.validated,
            "forms_count": len(fc.forms)
        }
        for fc in form_containers
    ]
    return jsonify(result), 200
