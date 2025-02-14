from flask import Blueprint, request, jsonify
from api.models import FormContainer, Form, Question
from api.extensions import db
from api.schemas import FormContainerSchema, FormSchema, QuestionSchema
from api.decorators.auth import authenticate_request
from api.decorators.validation import require_valid_app_ids
from api.helpers.tools import get_eq_emails, log_timeline_event, error_response
from api.models import Campaign

from marshmallow import ValidationError
from workflow.tasks import WorkflowManager

form_container_bp = Blueprint('form_container', __name__)
form_container_schema = FormContainerSchema()
form_schema = FormSchema()
question_schema = QuestionSchema()


@form_container_bp.before_request
def before_request():
    return authenticate_request()


@form_container_bp.route('/', methods=['POST'])
@require_valid_app_ids(param_name='app_id', source="json", allow_multiple=False)
def create_form_container():
    """
    Create a new form container with associated forms and questions.
    """
    data = request.json
    user_id = getattr(request, 'user_id', None)

    if not user_id:
        return error_response("User not authenticated", 401)

    try:
        validated_data = form_container_schema.load(data)
    except ValidationError as err:
        return error_response(err.messages, 400)

    campaign_id = validated_data.get('campaign_id')
    app_id = validated_data.get('app_id')

    if campaign_id and not Campaign.query.filter_by(id=campaign_id, app_id=app_id).first():
        return error_response("The provided campaign_id is not linked to the given app_id", 400)

    escalade_email, cc_emails = get_eq_emails(
        validated_data['user_email'],
        validated_data.get('escalade_email', ''),
        validated_data.get('cc_emails', [])
    )

    # Create a new FormContainer instance
    form_container = FormContainer(
        title=validated_data['title'],
        description=validated_data['description'],
        user_email=validated_data['user_email'],
        escalade_email=escalade_email,
        reference=validated_data.get('reference'),
        escalate=validated_data.get('escalate', False),
        initiated_by=user_id,
        reminder_delay=validated_data.get('reminder_delay_day'),
        cc_emails=cc_emails,
        app_id=app_id,
        campaign_id=campaign_id
    )
    db.session.add(form_container)
    db.session.commit()
    form_data = validated_data.get('forms')

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

    log_timeline_event(form_container.id, form.id, 'FormContainer created',
                       f'Form container created with title {form_container.title} by {user_id}')
    db.session.commit()

    mail_sender = 'hafsa@test.com'  # TODO: Get mail_sender from app_id or form_container
    WorkflowManager(mail_sender, form_container.user_email, form_container.cc_emails, form_container.access_token,
                    form_container.reminder_delay).start_workflow(form.id, form_container.id, form_container.escalate)

    result = form_container_schema.dump(form_container)
    return jsonify({
        "message": "Form container created successfully",
        "container_id": form_container.id,
        "form_id": form.id,
        "access_token": form_container.access_token,
        "form_container": result
    }), 201
