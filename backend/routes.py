from flask import Blueprint, jsonify, request, session
from models import db, FormContainer, Form, Question
from datetime import datetime
from workflow import FormWorkflowManager

api = Blueprint('api', __name__)
ADMIN_ID = 'd76476' # todo enlever cette ligne et la remplcer par ADMIN_ID


@api.route('/form-containers', methods=['POST'])
def create_form_container():
    data = request.json
    admin_id = ADMIN_ID

    if not admin_id:
        return jsonify({"error": "SuperAdmin non authentifié"}), 401

    form_container = FormContainer(
        title=data['title'],
        description=data['description'],
        user_email=data['user_email'],
        manager_email=data['manager_email'],
        reference=data.get('reference'),
        escalate=data.get('escalate', False),
        initiated_by=admin_id,
        reminder_delay=data.get('reminder_delay_day')
    )

    db.session.add(form_container)
    db.session.commit()

    form_data = data.get('form')
    if not form_data:
        return jsonify({"error": "Un formulaire est requis pour créer un conteneur"}), 400

    form = Form(form_container_id=form_container.id)

    for question_data in form_data['questions']:
        question = Question(
            label=question_data['label'],
            type=question_data['type'],
            options=question_data.get('options', []),
            is_required=question_data.get('isRequired', True)
        )
        form.questions.append(question)

    db.session.add(form)
    db.session.commit()

    return jsonify(
        {"container_id": form_container.id, "form_id": form.id, "access_token": form_container.access_token}), 201


@api.route('/form-containers/<int:container_id>/forms', methods=['POST'])
def add_form_to_container(container_id):
    admin_id = ADMIN_ID
    if not admin_id:
        return jsonify({"error": "SuperAdmin non authentifié"}), 401

    form_container = FormContainer.query.get_or_404(container_id)
    # todo enlever cette condition
    if form_container.initiated_by != admin_id:
        return jsonify({"error": "Vous n'êtes pas autorisé à modifier ce conteneur"}), 403

    if len(form_container.forms) >= 5:
        return jsonify({"error": "Vous ne pouvez pas ajouter plus de 5 formulaires à ce conteneur"}), 400

    data = request.json
    form = Form(
        form_container_id=container_id,
        questions=data['questions']
    )
    db.session.add(form)
    db.session.commit()

    return jsonify({"form_id": form.id}), 201


@api.route('/form-containers/<int:container_id>/forms/<int:form_id>/submit-response', methods=['POST'])
def submit_form_response(container_id, form_id):
    data = request.json
    responder_uid = data.get('responder_uid')

    form = Form.query.filter_by(id=form_id, form_container_id=container_id).first_or_404()

    if form.response:
        return jsonify({"error": "La réponse a déjà été soumise pour ce formulaire"}), 400

    form.response = data['response']
    form.responder_uid = responder_uid
    form.status = 'answered'
    db.session.commit()

    return jsonify({"message": "Réponse soumise avec succès"}), 200


@api.route('/form-containers', methods=['GET'])
def get_form_containers_by_super_admin():
    admin_id = ADMIN_ID

    if not admin_id:
        return jsonify({"error": "SuperAdmin non authentifié"}), 401

    form_containers = FormContainer.query.filter_by(initiated_by=admin_id).all()
    result = [
        {
            "id": fc.id,
            "title": fc.title,
            "description": fc.description,
            "user_email": fc.user_email,
            "manager_email": fc.manager_email,
            "reference": fc.reference,
            "escalate": fc.escalate,
            "validated": fc.validated,
            "forms_count": len(fc.forms)
        }
        for fc in form_containers
    ]
    return jsonify(result), 200


@api.route('/form-containers/<string:access_token>', methods=['GET'])
def get_form_container_by_access_token(access_token):
    form_container = FormContainer.query.filter_by(access_token=access_token).first_or_404()
    result = {
        "id": form_container.id,
        "title": form_container.title,
        "description": form_container.description,
        "user_email": form_container.user_email,
        "manager_email": form_container.manager_email,
        "reference": form_container.reference,
        "escalate": form_container.escalate,
        "validated": form_container.validated,
        "initiated_by": form_container.initiated_by,
        "forms": [
            {
                "form_id": form.id,
                "questions": [
                    {
                        "id": question.id,
                        "label": question.label,
                        "type": question.type,
                        "options": question.options,
                        "is_required": question.is_required
                    }
                    for question in form.questions
                ],
                "responses": [
                    {
                        "id": response.id,
                        "responder_uid": response.responder_uid,
                        "answers": response.answers,
                        "submitted_at": response.submitted_at,
                    }
                    for response in form.responses
                ],
                "status": form.status
            }
            for form in form_container.forms
        ]
    }
    return jsonify(result), 200


@api.route('/form-containers/<int:container_id>/validate', methods=['POST'])
def validate_form_container(container_id):
    admin_id = ADMIN_ID
    if not admin_id:
        return jsonify({"error": "SuperAdmin non authentifié"}), 401

    form_container = FormContainer.query.get_or_404(container_id)

    form_container.validated = True
    db.session.commit()
    form_workflow = FormWorkflowManager(container_id=form_container.id)
    form_workflow.stop_workflow()

    return jsonify({"message": "Form Container validé avec succès."}), 200


@api.route('/form-containers/<string:access_token>/timeline', methods=['GET'])
def get_form_container_timeline(access_token):
    form_container = FormContainer.query.filter_by(access_token=access_token, validated=False).first()
    if not form_container:
        return jsonify({"error": "Form Container introuvable ou déjà validé"}), 404

    user_email = session.get('user_email')
    admin_id = ADMIN_ID

    if (form_container.user_email != user_email) and (form_container.initiated_by != admin_id):
        return jsonify({"error": "Accès refusé"}), 403

    interaction_timeline = {
        "container_id": form_container.id,
        "title": form_container.title,
        "description": form_container.description,
        "user_email": form_container.user_email,
        "manager_email": form_container.manager_email,
        "reference": form_container.reference,
        "escalate": form_container.escalate,
        "forms": [
            {
                "form_id": form.id,
                "questions": form.questions,
                "response": form.response,
                "status": form.status,
                "created_at": form.created_at,
                "updated_at": form.updated_at
            }
            for form in form_container.forms
        ]
    }
    return jsonify(interaction_timeline), 200
