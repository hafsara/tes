from flask import Blueprint, request, jsonify
from marshmallow import ValidationError

from api.models import ConnectionLog
from api.extensions import db
from api.schemas import ConnectionLogSchema
from api.decorators.auth import authenticate_request, require_user_token

from api.helpers.tools import error_response

connection_log_bp = Blueprint('connection_log', __name__)
connection_log_schema = ConnectionLogSchema()


@connection_log_bp.before_request
def before_request():
    return authenticate_request()


@connection_log_bp.route('/', methods=['POST'])
@require_user_token
def log_connection():
    """
    Log a user connection with associated app IDs.
    """
    data = request.json
    try:
        validated_data = connection_log_schema.load(data)
    except ValidationError as err:
        return error_response(err.messages, 400)

    user_id = getattr(request, 'user_id', None)
    app_ids = validated_data.get('app_ids')

    if not user_id or not app_ids:
        return error_response("Missing required fields", 400)

    connection_log = ConnectionLog(user_id=user_id, app_ids=app_ids)
    db.session.add(connection_log)
    db.session.commit()
    result = connection_log_schema.dump(connection_log)
    return jsonify({"message": "Connection log added successfully", "connection_log": result}), 201
