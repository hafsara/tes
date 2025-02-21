from flask import Blueprint, request, jsonify
from marshmallow import ValidationError
import jwt
from datetime import datetime, timedelta
from config import Config

from api.extensions import db
from api.models import APIToken
from api.schemas import APITokenSchema
from api.helpers.tools import error_response
from api.routess.auth_decorators import require_user_token

api_token_bp = Blueprint("api_token_bp", __name__)
api_token_schema = APITokenSchema(session=db.session)
api_token_schema_partial = APITokenSchema(partial=True, session=db.session)
api_token_list_schema = APITokenSchema(many=True, session=db.session)

@api_token_bp.route('/api-tokens', methods=['POST'])
@require_user_token
def generate_api_token():
    """
    Generate a new API token.
    """
    data = request.json

    try:
        validated_data = api_token_schema.load(data)
    except ValidationError as err:
        return error_response(err.messages, 400)

    user_id = getattr(request, 'user_id', None)
    if not user_id:
        return error_response("User not authenticated", 401)

    payload = {
        "app_names": validated_data.app_names,
        "token_name": validated_data.token_name,
        "exp": validated_data.expiration,
        "iat": datetime.utcnow(),
    }

    api_token = jwt.encode(payload, Config.SECRET_KEY, algorithm='HS256')

    token_entry = APIToken(
        token=api_token,
        app_names=validated_data.app_names,
        token_name=validated_data.token_name,
        created_by=user_id,
        expiration=validated_data.expiration
    )

    db.session.add(token_entry)
    db.session.commit()

    return jsonify(api_token_schema.dump(token_entry)), 201


@api_token_bp.route('/api-tokens/<string:token>', methods=['DELETE'])
@require_user_token
def revoke_api_token(token):
    """
    Revoke an API token.
    """
    user_id = getattr(request, 'user_id', None)
    if not user_id:
        return error_response("User not authenticated", 401)

    token_entry = APIToken.query.filter_by(token=token).first()
    if not token_entry:
        return error_response("Token not found", 404)

    db.session.delete(token_entry)
    db.session.commit()

    return jsonify({"message": "API token revoked successfully"}), 200


@api_token_bp.route('/api-tokens', methods=['GET'])
@require_user_token
def get_api_tokens():
    """
    Retrieve all API tokens.
    """
    user_id = getattr(request, 'user_id', None)
    if not user_id:
        return error_response("User not authenticated", 401)

    tokens = APIToken.query.filter_by(created_by=user_id).all()

    return jsonify(api_token_list_schema.dump(tokens)), 200


@api_token_bp.route('/api-tokens/rotate', methods=['PUT'])
@require_user_token
def rotate_api_token():
    """
    Rotate an API token.
    """
    data = request.json

    try:
        validated_data = api_token_schema_partial.load(data)
    except ValidationError as err:
        return error_response(err.messages, 400)

    old_token = validated_data.token_name

    token_entry = APIToken.query.filter_by(token_name=old_token).first()
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

    new_token = jwt.encode(payload, Config.SECRET_KEY, algorithm='HS256')

    token_entry.token = new_token
    token_entry.expiration = expiration
    db.session.commit()

    return jsonify({"message": "Token rotated successfully", "new_token": new_token}), 200
