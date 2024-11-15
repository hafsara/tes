from flask import Blueprint, jsonify, request, session
from models import db, FormContainer, Form, Question, TimelineEntry, Response, Application, Campaign
from datetime import datetime, timedelta
from tasks import run_delayed_workflow, send_initial_notification_task
import jwt

api = Blueprint('api', __name__)
ADMIN_ID = 'd76476'  # todo enlever cette ligne et la remplacer par ADMIN_ID


@api.route('/applications', methods=['POST'])
def create_application():
    data = request.json
    app_name = data.get('name')
    app_id = data.get('id')

    if not app_name or not app_id:
        return jsonify({"error": "Application name and ID are required"}), 400

    application = Application(id=app_id, name=app_name)
    db.session.add(application)
    db.session.commit()

    return jsonify({"message": "Application created with success", "app_id": app_id}), 201


@api.route('/campaigns', methods=['POST'])
def create_campaign():
    data = request.json
    campaign_name = data.get('name')
    app_id = data.get('app_id')
    created_by = ADMIN_ID

    if not campaign_name or not app_id:
        return jsonify({"error": "Campaign name and app ID are required"}), 400

    campaign = Campaign(name=campaign_name, app_id=app_id, created_by=created_by)
    db.session.add(campaign)
    db.session.commit()

    return jsonify({"message": "Campaign successfully created", "campaign_id": campaign.id}), 201


@api.route('/form-containers', methods=['POST'])
def create_form_container():
    data = request.json
    admin_id = ADMIN_ID

    if not admin_id:
        return jsonify({"error": "Admin not authenticated"}), 401

    form_container = FormContainer(
        title=data['title'],
        description=data['description'],
        user_email=data['user_email'],
        escalade_email=data['escalade_email'],
        reference=data.get('reference'),
        escalate=data.get('escalate', False),
        initiated_by=admin_id,
        reminder_delay=data.get('reminder_delay_day'),
        app_id=data.get('app_id'),
        campaign_id=data.get('campaign_id')
    )

    db.session.add(form_container)
    db.session.commit()

    form_data = data.get('forms')
    if not form_data:
        return jsonify({"error": "A form is required to create a container"}), 400

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

    timeline_entry = TimelineEntry(
        form_container_id=form_container.id,
        event='FormContainer created',
        details=f'Form container created with title {form_container.title} by {admin_id}',
        timestamp=datetime.utcnow()
    )
    db.session.add(timeline_entry)

    db.session.commit()
    send_initial_notification_task(form_container.id)
    # TODO
    # run_delayed_workflow(container_id=form_container.id)

    return jsonify(
        {"container_id": form_container.id, "form_id": form.id, "access_token": form_container.access_token}), 201


@api.route('/form-containers/<int:container_id>/forms', methods=['POST'])
def add_form_to_container(container_id):
    admin_id = ADMIN_ID
    if not admin_id:
        return jsonify({"error": "Admin not authenticated"}), 401
    form_container = FormContainer.query.get_or_404(container_id)

    if len(form_container.forms) >= 5:
        return jsonify({"error": "You can't add more than 5 forms to this container"}), 400

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

    timeline_entry = TimelineEntry(
        form_container_id=form_container.id,
        event='Unsubstantial response',
        details=f'Response marked as unsubstantial by {admin_id}',
        timestamp=datetime.utcnow()
    )
    db.session.add(new_form)
    db.session.add(timeline_entry)

    try:
        db.session.commit()
        return jsonify({"form_id": new_form.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "An error occurred while adding the form"}), 500


@api.route('/form-containers/<string:access_token>/forms/<int:form_id>/submit-response', methods=['POST'])
def submit_form_response(access_token, form_id):
    data = request.json
    responder_uid = ADMIN_ID

    form_container = FormContainer.query.filter_by(access_token=access_token).first_or_404()
    if form_container.validated:
        return jsonify({"error": "Form container already validated"}), 401

    form = Form.query.filter_by(id=form_id, form_container_id=form_container.id).first_or_404()
    if form.status == 'answered':
        return jsonify({"error": "Form already answered"}), 401
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
        event='Response submitted',
        details=f'Response submitted for form ID {form_id} by {responder_uid}',
        timestamp=datetime.utcnow()
    )
    db.session.add(timeline_entry)
    db.session.commit()
    # form_workflow = FormWorkflowManager(container_id=form_container.id)
    # form_workflow.stop_workflow()
    return jsonify({"message": "Response submitted successfully"}), 200


@api.route('/form-containers/apps/<app_ids>', methods=['GET'])
def get_form_containers(app_ids):
    admin_id = ADMIN_ID

    if not admin_id:
        return jsonify({"error": "Admin not authenticated"}), 401

    filter_type = request.args.get('filter')
    status = request.args.get('status')
    if filter_type == 'status' and status:
        app_id_list = app_ids.split(',')
        query = (
            db.session.query(FormContainer, Application, Campaign)
            .join(Form, FormContainer.id == Form.form_container_id)
            .outerjoin(Application, FormContainer.app_id == Application.id)
            .outerjoin(Campaign, FormContainer.campaign_id == Campaign.id)
            .filter(Form.status == status)
        )

        if app_id_list:
            query = query.filter(FormContainer.app_id.in_(app_id_list))

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
                "app_name": app.name if app else None,
                "campaign_name": campaign.name if campaign else None
            }
            for fc, app, campaign in form_containers
        ]
    else:
        return jsonify({"error": "Invalid filter or status"}), 400

    return jsonify(result), 200


@api.route('/form-containers/<string:access_token>', methods=['GET'])
def get_form_container_by_access_token(access_token):
    form_container = FormContainer.query.filter_by(access_token=access_token).first_or_404()
    result = {
        "id": form_container.id,
        "title": form_container.title,
        "description": form_container.description,
        "user_email": form_container.user_email,
        "escalade_email": form_container.escalade_email,
        "reference": form_container.reference,
        "escalate": form_container.escalate,
        "validated": form_container.validated,
        "initiated_by": form_container.initiated_by,
        "forms": [
            {
                "form_id": form.id,
                "status": form.status,
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
            for form in form_container.forms
        ]
    }
    return jsonify(result), 200


@api.route('/form-containers/<int:container_id>/forms/<int:form_id>/validate', methods=['POST'])
def validate_form_container(container_id, form_id):
    admin_id = ADMIN_ID
    form_container = FormContainer.query.get_or_404(container_id)
    if not form_container:
        return jsonify({"error": "Form Container not found"}), 404

    if form_container.validated:
        return jsonify({"error": "Form container already validated"}), 401

    form = Form.query.filter_by(id=form_id, form_container_id=form_container.id).first()
    if not form:
        return jsonify({"error": "Form not found"}), 404

    form_container.validated = True
    form.status = 'validated'

    timeline_entry = TimelineEntry(
        form_container_id=form_container.id,
        event='FormContainer validated',
        details=f'Form container validated by {admin_id}',
        timestamp=datetime.utcnow()
    )
    db.session.add(timeline_entry)

    db.session.commit()

    return jsonify({"message": "Form successfully validated."}), 200


@api.route('/form-containers/<string:form_container_id>/timeline', methods=['GET'])
def get_form_container_timeline(form_container_id):
    timeline_entry = TimelineEntry.query.filter_by(form_container_id=form_container_id).all()
    if not timeline_entry:
        return jsonify({"error": "Timeline not found"}), 404

    interaction_timeline = [
        {
            "form_container_id": te.form_container_id,
            "event": te.event,
            "details": te.details,
            "timestamp": te.timestamp
        }
        for te in timeline_entry
    ]
    return jsonify(interaction_timeline), 200


@api.route('/validate-token/<token>', methods=['GET'])
def validate_token(token):
    application = Application.query.filter_by(id=token).first()
    if application:
        return jsonify({"is_valid": True, "token": generate_token(application)}), 200
    return jsonify({"is_valid": False, "token": None}), 401


@api.route('/campaigns/<string:app_id>', methods=['GET'])
def get_campaigns(app_id):
    campaigns = Campaign.query.filter_by(app_id=app_id).all()
    campaign_data = [{"name": campaign.name, "id": campaign.id} for campaign in campaigns]
    if campaign_data:
        return jsonify(campaign_data), 200

    return jsonify({"error": "Failed to fetch campaigns"}), 404


@api.route('/form-containers/<string:form_container_id>/forms/<int:form_id>/cancel', methods=['POST'])
def cancel_form(form_container_id, form_id):
    admin_id = ADMIN_ID
    data = request.get_json()
    comment = data.get('comment', '').strip()

    if not comment or len(comment) < 4:
        return jsonify({"error": "Comment must be at least 4 characters long."}), 400

    form = Form.query.filter_by(id=form_id, form_container_id=form_container_id).first()

    if not form:
        return jsonify({"error": "Form not found"}), 404

    form.status = 'canceled'
    form.cancel_comment = comment
    timeline_entry = TimelineEntry(
        form_container_id=form_container_id,
        event='FormContainer created',
        details=f'Form canceled by {admin_id} with comment: {comment}',
        timestamp=datetime.utcnow()
    )
    db.session.add(timeline_entry)
    db.session.commit()
    return jsonify({"message": "Form canceled successfully", "form_id": form_id, "comment": comment}), 200


def generate_token(application):
    payload = {
        'application_name': application.name,
        'app_id': application.id,
    }
    # todo
    token = jwt.encode(payload, 'your_secret_key', algorithm='HS256')
    return token
