from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from marshmallow import ValidationError
from sqlalchemy import and_, or_

from api.extensions import db
from api.models import FormContainer, Campaign, Form, TimelineEntry, Question, Response
from api.schemas import FormContainerSchema, FormContainerDetailSchema, FormContainerListSchema
from api.helpers.tools import get_eq_emails, error_response, log_timeline_event
from api.routes.auth_decorators import require_valid_app_ids, require_user_token

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

    escalade_email, cc_emails = get_eq_emails(
        validated_data['user_email'],
        validated_data.get('escalade_email', ''),
        validated_data.get('cc_emails')
    )

    # Récupération de `use_working_days`
    use_working_days = validated_data.get('use_working_days', False)

    form_container = FormContainer(
        title=validated_data['title'],
        description=validated_data['description'],
        user_email=validated_data['user_email'],
        escalade_email=escalade_email,
        reference=validated_data.get('reference'),
        escalate=validated_data.get('escalate', False),
        initiated_by=user_id,
        workflow_id=validated_data.get('workflow_id'),
        use_working_days=use_working_days,
        cc_emails=cc_emails,
        app_id=app_id,
        campaign_id=campaign_id
    )

    db.session.add(form_container)
    db.session.commit()

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
    # WorkflowManager(form_container).start_workflow(form.id)
    db.session.commit()
    return jsonify({
        "container_id": form_container.id,
        "form_id": form.id,
        "access_token": form_container.access_token
    }), 201


@form_container_bp.route("/form-containers", methods=["GET"])
@require_valid_app_ids(param_name="app_ids", source="args", allow_multiple=True)
def get_form_containers():
    """
    Retrieve paginated form containers associated with given app IDs.

    Query Params:
        - app_ids (str, required): Comma-separated list of application IDs.
        - status (str, optional): Status of the form containers (e.g., "open", "reminder", "escalate").
        - references (str, optional): Comma-separated list of references.
        - expired (bool, optional): Filter expired forms (`true` or `false`).
        - title (str, optional): Search by title (case-insensitive, partial match).
        - user_email (str, optional): Search by user email (case-insensitive, partial match).
        - campaign_ids (str, optional): Search by campaign name (case-insensitive, partial match).
        - dateRange (str, optional): Start and end date for `created_at`, formatted as `YYYY-MM-DD,YYYY-MM-DD`.
        - sort (str, optional): Sorting order (`asc` or `desc`, default: `desc`).
        - limit (int, optional): Number of results per page (default: 10).
        - page (int, optional): Page number (default: 1).

    Returns:
        JSON: A paginated list of form containers matching the criteria.
    """

    user_id = getattr(request, "user_id", None)
    if not user_id:
        return error_response("User not authenticated", 401)

    app_id_list = request.args.get("app_ids", "").split(",")

    if not app_id_list:
        return error_response("Applications ID required", 400)

    # Pagination
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 50, type=int)
    offset = (page - 1) * limit
    if page < 1 or limit < 1:
        return error_response("Invalid pagination parameters", 400)

    # Filters
    status = request.args.get("status")
    references = request.args.get("references", "")
    expired = request.args.get("expired", "false").lower() == "true"
    title = request.args.get("title", "").strip()
    user_email = request.args.get("user_email", "").strip()
    campaign_ids = request.args.get("campaign_ids", "")
    date_range = request.args.get("dateRange", "")

    query = FormContainer.query.filter(FormContainer.app_id.in_(app_id_list))

    if status:
        if status in ("reminder", "escalate"):
            query = query.filter(FormContainer.forms.any(and_(Form.workflow_step == status, Form.status == "open")))
        else:
            query = query.filter(FormContainer.forms.any(Form.status == status))

    if references:
        references_list = references.split(',')
        query = query.filter(FormContainer.reference.in_(references_list))

    if expired:
        query = query.filter(FormContainer.archived_at <= datetime.utcnow())

    if title:
        query = query.filter(FormContainer.title.ilike(f"%{title}%"))

    if user_email:
        query = query.filter(FormContainer.user_email.ilike(f"%{user_email}%"))

    if campaign_ids:
        campaign_list = campaign_ids.split(',')
        print(campaign_list)
        query = query.filter(or_(*[FormContainer.campaign_id.ilike(f"%{campaign}%") for campaign in campaign_list]))

    if date_range:
        try:
            start_date, end_date = date_range.split(",")
            start_date = datetime.fromisoformat(start_date.replace("Z", ""))
            end_date = datetime.fromisoformat(end_date.replace("Z", ""))
            if start_date and end_date:
                query = query.filter(FormContainer.created_at.between(start_date, end_date))
        except ValueError as e:
            return error_response("Invalid date format", 400)

    sort_order = request.args.get("sort", "desc").lower()
    if sort_order == "asc":
        query = query.order_by(FormContainer.created_at.asc())
    else:
        query = query.order_by(FormContainer.created_at.desc())

    total = query.count()
    paginated_query = query.limit(limit).offset(offset)
    results = paginated_query.all()
    schema = FormContainerListSchema(session=db.session, many=True)
    result = schema.dump(results)

    return jsonify({
        "total": total,
        "page": page,
        "page_size": limit,
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
    form_container.archived_at = datetime.utcnow() if archive else datetime.utcnow() + timedelta(
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
    timeline_entry = TimelineEntry.query.filter_by(form_container_id=form_container_id).order_by(
        TimelineEntry.timestamp.asc()).all()
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
    #from workflow.tasks import WorkflowManager, send_escalate_task

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
    manual_escalation = data.get("manual_escalation", False)
    manual_escalation_email = data.get("manual_escalation_email", "")
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
        db.session.commit()
        return jsonify({"form_id": new_form.id}), 201
    except Exception as e:
        db.session.rollback()
        return error_response("An error occurred while adding the form", 500)
