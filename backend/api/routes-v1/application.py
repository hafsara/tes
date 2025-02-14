import uuid

from flask import Blueprint, request, jsonify
from marshmallow import ValidationError

from api.models import Application
from api.extensions import db
from api.schemas import ApplicationSchema, TokenValidationSchema
from api.decorators.auth import authenticate_request
from api.helpers.tools import error_response, generate_token

application_bp = Blueprint('application', __name__)
application_schema = ApplicationSchema()
token_validation_schema = TokenValidationSchema()

@application_bp.before_request
def before_request():
    return authenticate_request()


@application_bp.route('/', methods=['POST'])
def create_application():
    data = request.json

    try:
        validated_data = application_schema.load(data)
    except ValidationError as err:
        return error_response(err.messages, 400)

    app_name = validated_data.get('name')
    mail_sender = validated_data.get('mail_sender')
    app_id = str(uuid.uuid4())

    if not app_name:
        return error_response("Application name is required", 400)

    created_by = getattr(request, 'user_id', None)
    application = Application(id=app_id, name=app_name, created_by=created_by, mail_sender=mail_sender)
    db.session.add(application)
    db.session.commit()

    result = application_schema.dump(application)
    return jsonify({"message": "Application created successfully", "application": result}), 201


@application_bp.route('/', methods=['GET'])
def get_applications():
    applications = Application.query.all()
    result = application_schema.dump(applications, many=True)
    return jsonify(result), 200


@application_bp.route('/validate-token/<string:token>', methods=['GET'])
def validate_token(token):
    """
    Validate an API token.
    """
    application = Application.query.filter_by(id=token).first()

    if application:
        new_token = generate_token(application)
        response_data = {"is_valid": True, "token": new_token}
    else:
        response_data = {"is_valid": False, "token": None}

    result = token_validation_schema.dump(response_data)
    return jsonify(result), 200 if application else 401
