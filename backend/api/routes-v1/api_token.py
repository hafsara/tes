import jwt
from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta

from api.models import APIToken
from api.extensions import db
from api.schemas import APITokenSchema
from api.decorators.auth import authenticate_request, require_user_token
from api.helpers.tools import error_response

from marshmallow import ValidationError

api_token_bp = Blueprint('api_token', __name__)
api_token_schema = APITokenSchema()


@api_token_bp.before_request
def before_request():
    return authenticate_request()


@api_token_bp.route('/', methods=['POST'])
@require_user_token
def generate_api_token():
    data = request.json
    user_id = getattr(request, 'user_id', None)

    if not user_id:
        return error_response("User not authenticated", 401)

    try:
        validated_data = api_token_schema.load(data)
    except ValidationError as err:
        return error_response(err.messages, 400)

    app_names = validated_data.get('app_names')
    token_name = validated_data.get('token_name')
    expiration_days = validated_data.get('expiration', 7)

    expiration = datetime.utcnow() + timedelta(days=expiration_days)
    payload = {
        "app_names": app_names,
        "token_name": token_name,
        "exp": expiration,
        "iat": datetime.utcnow(),
    }
    # todo Config your_secret_key
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

    result = api_token_schema.dump(token_entry)
    return jsonify({"api_token": result}), 201


@api_token_bp.route('/', methods=['GET'])
@require_user_token
def get_api_tokens():
    user_id = getattr(request, 'user_id', None)

    if not user_id:
        return error_response("User not authenticated", 401)

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


@api_token_bp.route('/revoke-api-token', methods=['DELETE'])
@require_user_token
def revoke_api_token():
    data = request.json
    token = data.get('token')
    user_id = getattr(request, 'user_id', None)

    if not user_id:
        return error_response("User not authenticated", 401)

    token_entry = APIToken.query.filter_by(token=token).first()
    if not token_entry:
        return error_response("Token not found", 404)

    db.session.delete(token_entry)
    db.session.commit()

    return jsonify({"message": "Token revoked successfully"}), 200


@api_token_bp.route('/rotate-api-token', methods=['PUT'])
@require_user_token
def rotate_api_token():
    data = request.json
    user_id = getattr(request, 'user_id', None)

    if not user_id:
        return error_response("User not authenticated", 401)

    try:
        validated_data = api_token_schema.load(data, partial=True)
    except ValidationError as err:
        return error_response(err.messages, 400)

    old_token = validated_data.get('old_token')

    token_entry = APIToken.query.filter_by(token=old_token).first()
    if not token_entry:
        return error_response("Token not found", 404)

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
