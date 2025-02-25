from flask import Blueprint, jsonify, request
import uuid
from marshmallow import ValidationError

from api.schemas import ApplicationSchema, ApplicationUpdateSchema, ConnectionLogSchema
from api.extensions import db
from api.models import Application, FormContainer, Campaign, ConnectionLog
from api.routess.auth_decorators import require_user_token
from api.helpers.tools import error_response, generate_token

application_bp = Blueprint('application_bp', __name__)
application_schema = ApplicationSchema(session=db.session)
application_update_schema = ApplicationUpdateSchema()
application_list_schema = ApplicationSchema(many=True, session=db.session)
connection_log_schema = ConnectionLogSchema(session=db.session)


@application_bp.route('/applications', methods=['POST'])
@require_user_token
def create_application():
    """Create a new application."""
    data = request.json
    created_by = getattr(request, 'user_id', None)

    if not created_by:
        return error_response("User not authenticated", 401)

    data['created_by'] = created_by

    try:
        validated_data = application_schema.load(data)
    except ValidationError as err:
        return error_response(err.messages, 400)

    new_app = Application(
        id=str(uuid.uuid4()),
        name=validated_data.name,
        created_by=validated_data.created_by,
        mail_sender=validated_data.mail_sender
    )
    db.session.add(new_app)
    db.session.commit()

    return jsonify({"message": "Application created successfully", "app_id": new_app.id}), 201


@application_bp.route('/applications', methods=['GET'])
@require_user_token
def get_applications():
    """Retrieve all applications."""
    applications = Application.query.all()
    return jsonify(application_list_schema.dump(applications)), 200


@application_bp.route("/applications/<string:app_id>", methods=["PUT"])
@require_user_token
def update_application(app_id):
    """
    Update an application's name, token (if required), and mail sender.
    If `generate_new_id` is set to True, updates all related entities.
    """
    data = request.json

    try:
        validated_data = application_update_schema.load(data)
    except ValidationError as err:
        return error_response(err.messages, 400)

    application = Application.query.filter_by(id=app_id).first_or_404()
    old_app_id = application.id
    generate_new_id = validated_data.get("generate_new_id", False)
    new_app_id = str(uuid.uuid4()) if generate_new_id else old_app_id

    if "name" in validated_data and application.name != validated_data["name"]:
        application.name = validated_data["name"]

    if "new_mail_sender" in validated_data and application.mail_sender != validated_data["new_mail_sender"]:
        application.mail_sender = validated_data["new_mail_sender"]

    if generate_new_id:
        application.id = new_app_id

    db.session.commit()

    # Update linked records if `generate_new_id` is True
    if generate_new_id:
        # TODO UPDATE API TOKEN
        db.session.query(FormContainer).filter(FormContainer.app_id == old_app_id).update({"app_id": new_app_id})
        db.session.query(Campaign).filter(Campaign.app_id == old_app_id).update({"app_id": new_app_id})
        db.session.commit()

    return jsonify({"message": "Application updated successfully", "app_token": application.id}), 200


@application_bp.route('/applications/log-connection', methods=['POST'])
@require_user_token
def log_connection():
    """
    Log a user's connection to an application.
    """
    data = request.json
    user_id = getattr(request, 'user_id', None)

    if not user_id:
        return error_response("User not authenticated", 401)

    data['user_id'] = user_id

    try:
        validated_data = connection_log_schema.load(data)
    except ValidationError as err:
        return error_response(err.messages, 400)



    connection_log = ConnectionLog(
        user_id=user_id,
        app_ids=validated_data.app_ids
    )
    db.session.add(connection_log)
    db.session.commit()

    return jsonify({"message": "Connection log added successfully"}), 201


@application_bp.route('/applications/validate-token/<string:token>', methods=['GET'])
@require_user_token
def validate_token(token):
    application = Application.query.filter_by(id=token).first()
    if application:
        return jsonify({"is_valid": True, "token": generate_token(application)}), 200
    return jsonify({"is_valid": False, "token": None}), 401
