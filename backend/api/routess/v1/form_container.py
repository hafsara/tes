from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from marshmallow import ValidationError
from sqlalchemy import and_

from api.extensions import db
from api.models import FormContainer, Campaign, Form, TimelineEntry, Question, Response
from api.schemas import FormContainerSchema, FormContainerDetailSchema, FormContainerListSchema
from api.helpers.tools import get_eq_emails, error_response, log_timeline_event
from api.routess.auth_decorators import require_valid_app_ids, require_user_token

from workflow.tasks import WorkflowManager

from config import Config

form_container_bp = Blueprint("form_container_bp", __name__)


@form_container_bp.route('/form-containers', methods=['POST'])
@require_valid_app_ids(param_name='app_id', source="json", allow_multiple=False)
def create_form_container():
    """
    Create a new form container.
    """
    data = request.json
    schema = FormContainerSchema()

    try:
        validated_data = schema.load(data)
    except ValidationError as err:
        return error_response(err.messages, 400)

    user_id = getattr(request, 'user_id', None)
    if not user_id:
        return error_response("User not authenticated", 401)

    # Verify campaign_id ↔ app_id
    campaign_id = validated_data.get("campaign_id")
    app_id = validated_data.get("app_id")

    if campaign_id and not Campaign.query.filter_by(id=campaign_id, app_id=app_id).first():
        return error_response("The provided campaign_id is not linked to the given app_id", 400)

    escalade_email, cc_emails = get_eq_emails(validated_data['user_email'],
                                              validated_data.get('escalade_email', ''),
                                              validated_data.get('cc_emails'))

    form_container = FormContainer(
        title=validated_data['title'],
        description=validated_data['description'],
        user_email=validated_data['user_email'],
        escalade_email=escalade_email,
        reference=validated_data.get('reference'),
        escalate=validated_data.get('escalate', False),
        initiated_by=user_id,
        reminder_delay=validated_data.get('reminder_delay'),
        cc_emails=cc_emails,
        app_id=app_id,
        campaign_id=campaign_id
    )

    db.session.add(form_container)
    db.session.commit()

    # Create form
    form_data = validated_data.get('forms')

    if not form_data:
        return error_response("A form is required to create a container", 400)

    form = Form(
        form_container_id=form_container.id,
        questions=[
            Question(
                label=question['label'],
                type=question['type'],
                options=question.get('options', []),
                is_required=question.get('isRequired', True)
            ) for question in form_data[0]['questions']
        ]
    )
    db.session.add(form)
    db.session.commit()
    log_timeline_event(
        form_container_id=form_container.id,
        form_id=form.id,
        event="FormContainer created",
        details=f'Form container created with title {form_container.title} by {user_id}'
    )
    db.session.commit()
    WorkflowManager(form_container).start_workflow(form.id, form_container.id, form_container.escalate)

    return jsonify({
        "container_id": form_container.id,
        "form_id": form.id,
        "access_token": form_container.access_token
    }), 201


@form_container_bp.route("/form-containers", methods=["GET"])
@require_valid_app_ids(param_name="app_ids", source="args", allow_multiple=True)
def get_form_containers():
    """
    Retrieve all form containers associated with given app IDs.

    Query Params:
        - app_ids (str, required): Comma-separated list of application IDs.
        - filter (str, optional): Filter type (e.g., "status").
        - status (str, optional): Status of the form containers (e.g., "open", "reminder", "escalate").
        - sort (str, optional): Sorting order (default: "desc").
        - limit (int, optional): Number of results to return (default: 50).
        - page (int, optional): Pagination page (default: 1).

    Returns:
        JSON: A list of form containers matching the criteria.
    """
    batch_size = 100
    all_results = []
    offset = 0

    user_id = getattr(request, "user_id", None)
    if not user_id:
        return error_response("User not authenticated", 401)

    app_id_list = request.args.get("app_ids", "").split(",")

    if not app_id_list:
        return error_response("Applications id required", 401)

    filter_type = request.args.get("filter")
    status = request.args.get("status")
    sort_order = request.args.get("sort", "desc").lower()

    query = FormContainer.query.filter(FormContainer.app_id.in_(app_id_list))

    if filter_type == "status" and status:
        if status in ("reminder", "escalate"):
            query = query.filter(FormContainer.forms.any(and_(Form.workflow_step == status, Form.status == "open")))
        else:
            query = query.filter(FormContainer.forms.any(Form.status == status))

    if sort_order == "asc":
        query = query.order_by(FormContainer.created_at.asc())
    else:
        query = query.order_by(FormContainer.created_at.desc())

    while True:
        batch = query.limit(batch_size).offset(offset).all()
        if not batch:
            break
        all_results.extend(batch)
        offset += batch_size

    schema = FormContainerListSchema(session=db.session, many=True)
    result = schema.dump(all_results)

    return jsonify({
        "total": len(result),
        "form_containers": result
    }), 200


@form_container_bp.route('/form-containers/<string:access_token>', methods=['GET'])
@require_user_token
def get_form_container_by_access_token(access_token):
    """
    Retrieve form container details by access token.
    """
    form_container = FormContainer.query.filter_by(access_token=access_token).first_or_404()
    schema = FormContainerDetailSchema(session=db.session)
    return jsonify(schema.dump(form_container)), 200


@form_container_bp.route("/form-containers/<int:container_id>/forms/<int:form_id>/validate", methods=["POST"])
@require_user_token
def validate_form_container(container_id, form_id):
    """
    Validate a form container and its corresponding form.

    Request Body:
        - archive (bool, optional): If True, archive the form immediately.
                                    Otherwise, set a default archive date (+90 days).

    Returns:
        JSON: Confirmation message and archive timestamp.
    """
    user_id = getattr(request, "user_id", None)
    if not user_id:
        return error_response("User not authenticated", 401)

    form_container = FormContainer.query.get_or_404(container_id)

    if form_container.validated:
        return error_response("Form container already validated", 400)

    form = Form.query.filter_by(id=form_id, form_container_id=form_container.id).first_or_404()

    data = request.json or {}
    archive = data.get("archive", False)

    form_container.validated = True
    form_container.archive_at = datetime.utcnow() if archive else datetime.utcnow() + timedelta(
        days=Config.ARCHIVE_DELAY_DAYS)
    form.status = "validated"

    log_timeline_event(
        form_container_id=form_container.id,
        form_id=form.id,
        event="FormContainer validated",
        details=f"Form container validated by {user_id}"
    )

    db.session.commit()

    return jsonify({
        "message": "Form successfully validated.",
        "archive_at": form_container.archive_at.isoformat()
    }), 200


@form_container_bp.route('/form-containers/<int:container_id>/forms/<int:form_id>/cancel', methods=['POST'])
@require_user_token
def cancel_form_container(container_id, form_id):
    """
    Cancel a form within a form container.

    Request Body:
        - comment (str): Reason for cancellation (at least 4 characters).

    Returns:
        JSON: Confirmation message with form ID and cancellation comment.
    """
    user_id = getattr(request, "user_id", None)
    if not user_id:
        return error_response("User not authenticated", 401)

    # Get request data
    data = request.json or {}
    comment = data.get("comment", "").strip()

    if not comment or len(comment) < 4:
        return error_response("Comment must be at least 4 characters long.", 400)

    form = Form.query.filter_by(id=form_id, form_container_id=container_id).first_or_404()

    if form.status != "open":
        return error_response("Form cannot be cancelled.", 400)

    form.status = "canceled"
    form.cancel_comment = comment

    log_timeline_event(
        form_container_id=container_id,
        form_id=form.id,
        event="Form canceled",
        details=f"Form {form_id} was canceled by {user_id} with comment: {comment}"
    )

    db.session.commit()

    return jsonify({
        "message": "Form canceled successfully.",
        "form_id": form_id,
        "comment": comment
    }), 200


@form_container_bp.route('/form-containers/<int:form_container_id>/timeline', methods=['GET'])
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


@form_container_bp.route('/form-containers/total-count', methods=['GET'])
@require_valid_app_ids(param_name="app_ids", source="args", allow_multiple=True)
def get_total_forms_count():
    """
    Get the total count of Form entries filtered by app_ids via their FormContainers.
    """
    app_ids_list = request.args.get("app_ids", "").split(",")

    if not app_ids_list:
        return error_response("Applications id required", 401)

    try:
        total_count = db.session.query(Form).join(FormContainer).filter(FormContainer.app_id.in_(app_ids_list)).count()
        return jsonify({"totalCount": total_count}), 200
    except Exception as e:
        return error_response(str(e), 500)

@form_container_bp.route('/form-containers/<int:container_id>/forms', methods=['POST'])
@require_valid_app_ids(param_name="app_id", source="args", allow_multiple=False)
def add_form_to_container(container_id):
    user_id = getattr(request, 'user_id', None)

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

    try:
        log_timeline_event(form_container.id, new_form.id, 'Unsubstantial response',
                           f'Response marked as unsubstantial by {user_id}')
        WorkflowManager(form_container).start_workflow(new_form.id, form_container.id,
                                                       form_container.escalate)
        db.session.commit()
        return jsonify({"form_id": new_form.id}), 201
    except Exception as e:
        db.session.rollback()
        return error_response("An error occurred while adding the form", 500)
