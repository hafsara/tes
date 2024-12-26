import uuid

from flask import Blueprint, jsonify, request
from api.models import FormContainer, Form, Question, TimelineEntry, Response, Application, Campaign, ConnectionLog, \
    APIToken
from datetime import datetime, timedelta
from extensions import db
import jwt

api = Blueprint('api', __name__)


@api.before_request
def authenticate_request():
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"error": "Missing Authorization Header"}), 401

    if auth_header.startswith("Basic "):
        import base64
        try:
            credentials = base64.b64decode(auth_header.split(" ")[1]).decode("utf-8")
            username, password = credentials.split(":")
            if username == "admin" and password == "admin":
                if not Application.query.first():
                    request.user_id = username
                else:
                    return jsonify({"error": "Applications already exist. Access denied."}), 403
            else:
                return jsonify({"error": "Invalid admin credentials."}), 401
        except Exception as e:
            return jsonify({"error": f"Invalid Authorization Header format: {str(e)}"}), 400
    try:
        token = auth_header.split(" ")[1] if " " in auth_header else auth_header
        decoded_token = jwt.decode(token, 'your_secret_key', algorithms=['HS256'])
        if "app_names" in decoded_token:
            request.app_names = decoded_token["app_names"]
            request.user_id = decoded_token["token_name"]
        elif "sub" in decoded_token:
            request.user_id = decoded_token["sub"]
            request.app_names = None
        else:
            raise jwt.InvalidTokenError("Invalid token structure")
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return jsonify({"error": "Invalid or expired token."}), 401


def error_response(message, status_code):
    return jsonify({"error": message}), status_code


@api.route('/applications', methods=['POST'])
def create_application():
    data = request.json
    app_name = data.get('name')
    app_id = str(uuid.uuid4())

    if not app_name:
        return error_response("Application name and ID are required", 400)

    created_by = getattr(request, 'user_id', None)
    application = Application(id=app_id, name=app_name, created_by=created_by)
    db.session.add(application)
    db.session.commit()

    return jsonify({"message": "Application created successfully", "app_id": app_id}), 201


@api.route('/applications', methods=['GET'])
def get_applications():
    applications = Application.query.all()
    result = [
        {
            "id": app.id,
            "name": app.name,
            "created_at": app.created_at,
            "created_by": app.created_by
        }
        for app in applications
    ]
    return jsonify(result), 200


@api.route('/campaigns', methods=['POST'])
def create_campaign():
    data = request.json
    campaign_name = data.get('name')
    app_id = data.get('app_id')
    created_by = getattr(request, 'user_id', None)

    if not created_by:
        return error_response("User not authenticated", 401)

    if not campaign_name or not app_id:
        return error_response("Campaign name and app ID are required", 400)

    campaign = Campaign(name=campaign_name, app_id=app_id, created_by=created_by)
    db.session.add(campaign)
    db.session.commit()

    return jsonify({"message": "Campaign created successfully", "campaign_id": campaign.id}), 201


@api.route('/form-containers', methods=['POST'])
def create_form_container():
    data = request.json
    user_id = getattr(request, 'user_id', None)

    if not user_id:
        return error_response("User not authenticated", 401)

    form_container = FormContainer(
        title=data['title'],
        description=data['description'],
        user_email=data['user_email'],
        escalade_email=data['escalade_email'],
        reference=data.get('reference'),
        escalate=data.get('escalate', False),
        initiated_by=user_id,
        reminder_delay=data.get('reminder_delay_day'),
        cc_emails=data.get('cc_emails'),
        app_id=data.get('app_id'),
        campaign_id=data.get('campaign_id')
    )
    db.session.add(form_container)
    db.session.commit()

    form_data = data.get('forms')
    if not form_data:
        return error_response("A form is required to create a container", 400)

    form = Form(form_container_id=form_container.id, questions=[
        Question(
            label=question_data['label'],
            type=question_data['type'],
            options=question_data.get('options', []),
            is_required=question_data.get('isRequired', True)
        )
        for question_data in form_data['questions']
    ])
    db.session.add(form)
    db.session.commit()

    timeline_entry = TimelineEntry(
        form_container_id=form_container.id,
        form_id=form.id,
        event='FormContainer created',
        details=f'Form container created with title {form_container.title} by {user_id}',
        timestamp=datetime.utcnow()
    )
    db.session.add(timeline_entry)
    db.session.commit()

    return jsonify({
        "container_id": form_container.id,
        "form_id": form.id,
        "access_token": form_container.access_token
    }), 201


@api.route('/form-containers/apps/<string:app_ids>', methods=['GET'])
def get_form_containers(app_ids):
    user_id = getattr(request, 'user_id', None)

    if not user_id:
        return error_response("User not authenticated", 401)

    filter_type = request.args.get('filter')
    status = request.args.get('status')
    if filter_type == 'status' and status:
        app_id_list = app_ids.split(',')
        query = (FormContainer.query
                 .filter(FormContainer.app_id.in_(app_id_list))
                 .filter(FormContainer.forms.any(Form.status == status))
                 .order_by(FormContainer.created_at.desc()))
        form_containers = query.all()
        result = [
            {
                "access_token": fc.access_token,
                "title": fc.title,
                "description": fc.description,
                "created_at": fc.created_at,
                "user_email": fc.user_email,
                "escalade_email": fc.escalade_email,
                "reference": fc.reference,
                "app_name": fc.application.name,
                "campaign_name": fc.campaign.name
            }
            for fc in form_containers
        ]
    else:
        return error_response("Invalid filter or status", 400)

    return jsonify(result), 200


@api.route('/form-containers/<string:access_token>', methods=['GET'])
def get_form_container_by_access_token(access_token):
    form_container = FormContainer.query.filter_by(access_token=access_token).first_or_404()
    sorted_forms = sorted(form_container.forms, key=lambda form: form.created_at or datetime.min, reverse=True)

    result = {
        "id": form_container.id,
        "title": form_container.title,
        "description": form_container.description,
        "user_email": form_container.user_email,
        "escalade_email": form_container.escalade_email,
        "reference": form_container.reference,
        "cc_emails": form_container.cc_emails,
        "escalate": form_container.escalate,
        "validated": form_container.validated,
        "reminder_delay": form_container.reminder_delay,
        "initiated_by": form_container.initiated_by,
        "created_at": form_container.created_at,
        "app_name": form_container.application.name,
        "campaign_name": form_container.campaign.name,
        "forms": [
            {
                "form_id": form.id,
                "status": form.status,
                "cancel_comment": form.cancel_comment,
                "created_at": form.created_at,
                "questions": [
                    {
                        "id": question.id,
                        "label": question.label,
                        "type": question.type,
                        "options": question.options,
                        "is_required": question.is_required,
                        "response": getattr(question, 'response', None)
                    }
                    for question in form.questions
                ],
                "responses": [
                    {
                        "responder_uid": response.responder_uid,
                        "submitted_at": response.submitted_at,
                        "answers": response.answers
                    }
                    for response in form.responses
                ]
            }
            for form in sorted_forms
        ]
    }

    return jsonify(result), 200


@api.route('/form-containers/<int:container_id>/forms/<int:form_id>/validate', methods=['POST'])
def validate_form_container(container_id, form_id):
    user_id = getattr(request, 'user_id', None)

    if not user_id:
        return error_response("User not authenticated", 401)

    form_container = FormContainer.query.get_or_404(container_id)

    if not form_container:
        return error_response("Form Container not found", 404)

    if form_container.validated:
        return error_response("Form container already validated", 401)

    form = Form.query.filter_by(id=form_id, form_container_id=form_container.id).first()

    if not form:
        return error_response("Form not found", 404)

    form_container.validated = True
    form.status = 'validated'

    timeline_entry = TimelineEntry(
        form_container_id=form_container.id,
        form_id=form.id,
        event='FormContainer validated',
        details=f'Form container validated by {user_id}',
        timestamp=datetime.utcnow()
    )
    db.session.add(timeline_entry)

    db.session.commit()

    return jsonify({"message": "Form successfully validated."}), 200


@api.route('/form-containers/<int:form_container_id>/timeline', methods=['GET'])
def get_form_container_timeline(form_container_id):
    timeline_entry = TimelineEntry.query.filter_by(form_container_id=form_container_id).all()
    if not timeline_entry:
        return error_response("Timeline not found", 404)

    interaction_timeline = [
        {
            "form_container_id": te.form_container_id,
            "form_id": te.form_id,
            "event": te.event,
            "details": te.details,
            "timestamp": te.timestamp
        }
        for te in timeline_entry
    ]
    return jsonify(interaction_timeline), 200


@api.route('/validate-token/<string:token>', methods=['GET'])
def validate_token(token):
    application = Application.query.filter_by(id=token).first()
    if application:
        return jsonify({"is_valid": True, "token": generate_token(application)}), 200
    return jsonify({"is_valid": False, "token": None}), 401


@api.route('/campaigns/<string:app_id>', methods=['GET'])
def get_campaigns(app_id):
    campaigns = Campaign.query.filter_by(app_id=app_id).all()
    campaign_data = [{
        "name": campaign.name,
        "id": campaign.id,
        "created_at": campaign.created_at,
        "created_by": campaign.created_by
    } for campaign in campaigns]
    return jsonify(campaign_data), 200


@api.route('/form-containers/<int:form_container_id>/forms/<int:form_id>/cancel', methods=['POST'])
def cancel_form(form_container_id, form_id):
    user_id = getattr(request, 'user_id', None)

    if not user_id:
        return error_response("User not authenticated", 401)

    data = request.get_json()
    comment = data.get('comment', '').strip()

    if not comment or len(comment) < 4:
        return error_response("Comment must be at least 4 characters long.", 400),

    form = Form.query.filter_by(id=form_id, form_container_id=form_container_id).first()

    if not form:
        return error_response("Form not found", 404)

    form.status = 'canceled'
    form.cancel_comment = comment

    timeline_entry = TimelineEntry(
        form_container_id=form_container_id,
        form_id=form.id,
        event='FormContainer canceled',
        details=f'Form canceled by {user_id} with comment: {comment}',
        timestamp=datetime.utcnow()
    )
    db.session.add(timeline_entry)
    db.session.commit()
    return jsonify({"message": "Form canceled successfully", "form_id": form_id, "comment": comment}), 200


@api.route('/form-containers/<int:container_id>/forms', methods=['POST'])
def add_form_to_container(container_id):
    user_id = getattr(request, 'user_id', None)

    if not user_id:
        return error_response("User not authenticated", 401)

    if not user_id:
        return error_response("User not authenticated", 401)
    form_container = FormContainer.query.get_or_404(container_id)

    if len(form_container.forms) >= 5:
        return error_response("You can't add more than 5 forms to this container", 400)

    current_form = next((form for form in form_container.forms if form.status == 'answered'), None)

    if current_form:
        current_form.status = 'unsubstantial'

    data = request.json
    questions_data = data.get('questions', [])
    questions = [Question(label=question['label'], type=question['type'], options=question.get('options', []),
                          is_required=question.get('isRequired', True)) for question in questions_data]
    new_form = Form(
        form_container_id=container_id,
        questions=questions
    )
    try:
        db.session.add(new_form)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return error_response("An error occurred while adding the form", 500)

    timeline_entry = TimelineEntry(
        form_container_id=form_container.id,
        form_id=new_form.id,
        event='Unsubstantial response',
        details=f'Response marked as unsubstantial by {user_id}',
        timestamp=datetime.utcnow()
    )
    try:
        db.session.add(timeline_entry)
        db.session.commit()
        return jsonify({"form_id": new_form.id}), 201
    except Exception as e:
        db.session.rollback()
        return error_response("An error occurred while adding the form", 500)


@api.route('/form-containers/<string:access_token>/forms/<int:form_id>/submit-response', methods=['POST'])
def submit_form_response(access_token, form_id):
    data = request.json
    responder_uid = getattr(request, 'user_id', None)

    if not responder_uid:
        return error_response("User not authenticated", 401)

    form_container = FormContainer.query.filter_by(access_token=access_token).first_or_404()
    if form_container.validated:
        return error_response("Form container already validated", 401)

    form = Form.query.filter_by(id=form_id, form_container_id=form_container.id).first_or_404()

    if form.status == 'answered':
        return error_response("Form already answered", 401)

    response_record = Response(
        form_id=form.id,
        responder_uid=responder_uid,
        answers=[]
    )

    for question_data in data.get('questions', []):
        question_id = question_data.get('id')
        response_content = question_data.get('response')
        question = Question.query.filter_by(id=question_id, form_id=form.id).first_or_404()
        question.response = response_content
        response_record.answers.append({
            "questionId": question.id,
            "response": response_content
        })

    form.responses.append(response_record)
    form.status = 'answered'

    timeline_entry = TimelineEntry(
        form_container_id=form_container.id,
        form_id=form.id,
        event='Response submitted',
        details=f'Response submitted for form ID {form_id} by {responder_uid}',
        timestamp=datetime.utcnow()
    )
    db.session.add(timeline_entry)
    db.session.commit()
    return jsonify({"message": "Response submitted successfully"}), 200


@api.route('/campaigns/<int:campaign_id>', methods=['PUT'])
def update_campaign(campaign_id):
    """
    Update campaign
    """
    data = request.json
    new_name = data.get('name')

    if not new_name:
        return error_response("Campaign name is required to update.", 400)

    campaign = Campaign.query.get_or_404(campaign_id)
    campaign.name = new_name

    db.session.commit()

    return jsonify({"message": "Campaign updated successfully", "campaign_id": campaign_id}), 200


@api.route('/applications/<string:app_token>', methods=['PUT'])
def update_application(app_token):
    """
    Update Application Name or Token
    """
    data = request.json
    new_name = data.get('name')
    new_token = data.get('new_token')

    if not new_name and not new_token:
        return error_response("Name or new token is required to update the application.", 400)

    application = Application.query.filter_by(token=app_token).first_or_404()

    if new_name:
        application.name = new_name
    if new_token:
        application.token = new_token

    db.session.commit()

    return jsonify({"message": "Application updated successfully", "app_token": application.token}), 200


@api.route('/form-containers/apps/<string:app_ids>/validated', methods=['GET'])
def get_validated_form_containers(app_ids):
    app_id_list = app_ids.split(',')
    validated_form_containers = db.session.query(FormContainer).filter(FormContainer.validated == True).filter(
        FormContainer.app_id.in_(app_id_list)).all()

    result = [
        {
            "access_token": form_container.access_token,
            "title": form_container.title,
            "description": form_container.description,
            "created_at": form_container.created_at,
            "user_email": form_container.user_email,
            "escalade_email": form_container.escalade_email,
            "reference": form_container.reference,
            "app_name": form_container.application.name,
            "campaign_name": form_container.campaign.name,
        }
        for form_container in validated_form_containers
    ]

    return jsonify(result), 200


@api.route('/forms/<int:form_id>', methods=['GET'])
def get_form_by_id(form_id):
    form = Form.query.get_or_404(form_id)
    if not form:
        return error_response("Form not found", 404)
    form_data = {"questions": [
        {
            "id": question.id,
            "label": question.label,
            "type": question.type,
            "options": question.options,
            "is_required": question.is_required,
            "response": getattr(question, 'response', None)
        }
        for question in form.questions]
    }

    return jsonify(form_data), 201


@api.route('/forms/apps/<string:app_ids>/total-count', methods=['GET'])
def get_total_forms_count(app_ids):
    """
    Get the total count of Form entries filtered by app_ids via their FormContainers.
    """
    app_ids_list = app_ids.split(',')
    try:
        total_count = db.session.query(Form).join(FormContainer).filter(FormContainer.app_id.in_(app_ids_list)).count()
        return jsonify({"totalCount": total_count}), 200
    except Exception as e:
        return error_response(str(e), 500)


@api.route('/log-connection', methods=['POST'])
def log_connection():
    data = request.json
    user_id = getattr(request, 'user_id', None)
    app_ids = data.get('app_ids')
    if not user_id or not app_ids:
        return jsonify({"error": "Missing required fields"}), 400

    connection_log = ConnectionLog(user_id=user_id, app_ids=app_ids)
    db.session.add(connection_log)
    db.session.commit()

    return jsonify({"message": "Connection log added successfully"}), 201


@api.route('/generate-api-token', methods=['POST'])
def generate_api_token():
    data = request.json
    user_id = getattr(request, 'user_id', None)

    if not user_id:
        return jsonify({"error": "User not authenticated"}), 401

    app_names = data.get('app_names')
    token_name = data.get('token_name')
    expiration_days = data.get('expiration', 7)

    if not app_names or not isinstance(app_names, list):
        return jsonify({"error": "applications must be a list"}), 400
    if not token_name:
        return jsonify({"error": "token_name is required"}), 400

    expiration = datetime.utcnow() + timedelta(days=expiration_days)
    payload = {
        "app_names": app_names,
        "token_name": token_name,
        "exp": expiration,
        "iat": datetime.utcnow(),
    }
    api_token = jwt.encode(payload, 'your_secret_key', algorithm='HS256')

    token_entry = APIToken(
        token=api_token,
        app_names=app_names,
        token_name=token_name,
        created_by=user_id,
        expiration=expiration
    )
    db.session.add(token_entry)
    db.session.commit()

    return jsonify({"api_token": api_token}), 201


@api.route('/revoke-api-token', methods=['DELETE'])
def revoke_api_token():
    data = request.json
    token = data.get('token')
    user_id = getattr(request, 'user_id', None)

    if not user_id:
        return jsonify({"error": "User not authenticated"}), 401

    token_entry = APIToken.query.filter_by(token=token).first()
    if not token_entry:
        return jsonify({"error": "Token not found"}), 404

    db.session.delete(token_entry)
    db.session.commit()

    return jsonify({"message": "Token revoked successfully"}), 200


@api.route('/api-tokens', methods=['GET'])
def get_api_tokens():
    user_id = getattr(request, 'user_id', None)

    if not user_id:
        return jsonify({"error": "User not authenticated"}), 401

    tokens = APIToken.query.all()
    result = [
        {
            "token": token.token,
            "app_names": token.app_names,
            "expiration": token.expiration,
            "token_name": token.token_name,
            "created_at": token.created_at,
            "created_by": token.created_by
        }
        for token in tokens
    ]
    return jsonify(result), 200


@api.route('/rotate-api-token', methods=['PUT'])
def rotate_api_token():
    data = request.json
    old_token = data.get('old_token')

    token_entry = APIToken.query.filter_by(token=old_token).first()
    if not token_entry:
        return jsonify({"error": "Token not found"}), 404

    validity_duration = (token_entry.expiration - token_entry.created_at).days
    expiration = datetime.utcnow() + timedelta(days=validity_duration)

    payload = {
        "app_names": token_entry.app_names,
        "token_name": token_entry.token_name,
        "exp": expiration,
        "iat": datetime.utcnow(),
    }

    new_token = jwt.encode(payload, 'your_secret_key', algorithm='HS256')

    token_entry.token = new_token
    token_entry.expiration = expiration
    db.session.commit()

    return jsonify({"newToken": new_token}), 200


def generate_token(application):
    payload = {'application_name': application.name, 'app_id': application.id}
    token = jwt.encode(payload, 'your_secret_key', algorithm='HS256')
    return token
