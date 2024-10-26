from flask import Blueprint, jsonify, request, session
from models import db, FormContainer, Form
from datetime import datetime
from form_workflow_manager import FormWorkflowManager

api = Blueprint('api', __name__)


@api.route('/form-containers', methods=['POST'])
def create_form_container():
    data = request.json
    super_admin_id = session.get('super_admin_id')

    if not super_admin_id:
        return jsonify({"error": "SuperAdmin non authentifié"}), 401

    # Créer le FormContainer avec un lien unique
    form_container = FormContainer(
        title=data['title'],
        user_email=data['user_email'],
        manager_email=data['manager_email'],
        ticket=data.get('ticket'),
        escalation=data.get('escalation', False),
        initiated_by=super_admin_id
    )
    form_container.generate_unique_link()

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

    return jsonify({"container_id": form_container.id, "form_id": form.id, "link": form_container.unique_link}), 201


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


# Endpoint pour soumettre une réponse à un formulaire dans un Form Container
@api.route('/form-containers/<int:container_id>/forms/<int:form_id>/submit-response', methods=['POST'])
def submit_form_response(container_id, form_id):
    data = request.json
    responder_email = data.get('responder_email')

    form = Form.query.filter_by(id=form_id, form_container_id=container_id).first_or_404()

    if form.response:
        return jsonify({"error": "La réponse a déjà été soumise pour ce formulaire"}), 400

    form.response = data['response']
    form.responder_email = responder_email
    form.status = 'answered'
    db.session.commit()

    return jsonify({"message": "Réponse soumise avec succès"}), 200


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


@api.route('/form-container/<string:encoded_id>', methods=['GET'])
def view_form_container(encoded_id):
    try:
        # Décodage de l'ID
        container_id = int(base64.urlsafe_b64decode(encoded_id).decode())
    except (ValueError, TypeError):
        return abort(404)  # Si le lien est invalide

    # Récupérer le FormContainer
    form_container = FormContainer.query.get(container_id)
    if not form_container or form_container.validated:
        return abort(404)  # Conteneur inexistant ou validé

    # Retourner les détails du FormContainer et des formulaires associés
    result = {
        "id": form_container.id,
        "title": form_container.title,
        "user_email": form_container.user_email,
        "forms": [
            {
                "form_id": form.id,
                "fields": form.fields,
                "response": form.response,
                "status": form.status
            }
            for form in form_container.forms
        ]
    }
    return jsonify(result), 200


@api.route('/form-containers/<int:container_id>/validate', methods=['POST'])
def validate_form_container(container_id):
    super_admin_id = session.get('super_admin_id')
    if not super_admin_id:
        return jsonify({"error": "SuperAdmin non authentifié"}), 401

    form_container = FormContainer.query.get_or_404(container_id)

    if form_container.initiated_by != super_admin_id:
        return jsonify({"error": "Vous n'êtes pas autorisé à valider ce conteneur"}), 403

    form_container.validated = True
    db.session.commit()

    # Utilisation de FormWorkflowManager pour stopper le workflow
    form_workflow = FormWorkflowManager(container_id=form_container.id)
    form_workflow.stop_workflow()

    return jsonify({"message": "Form Container validé avec succès."}), 200


@api.route('/form-containers/<string:unique_link>/history', methods=['GET'])
def get_form_container_history(unique_link):
    # Récupération du Form Container par lien unique
    form_container = FormContainer.query.filter_by(unique_link=unique_link, validated=False).first()
    if not form_container:
        return jsonify({"error": "Form Container introuvable ou déjà validé"}), 404

    # Récupération de l'email ou de l'ID utilisateur de la session pour vérifier l'accès
    user_email = session.get('user_email')
    super_admin_id = session.get('super_admin_id')

    # Vérification de l'autorisation
    if (form_container.user_email != user_email) and (form_container.initiated_by != super_admin_id):
        return jsonify({"error": "Accès refusé"}), 403

    # Historique des interactions
    interaction_history = {
        "container_id": form_container.id,
        "title": form_container.title,
        "user_email": form_container.user_email,
        "manager_email": form_container.manager_email,
        "ticket": form_container.ticket,
        "escalation": form_container.escalation,
        "forms": [
            {
                "form_id": form.id,
                "fields": form.fields,
                "response": form.response,
                "status": form.status,
                "created_at": form.created_at,
                "updated_at": form.updated_at
            }
            for form in form_container.forms
        ]
    }
    return jsonify(interaction_history), 200
