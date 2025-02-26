import jwt
from flask import request, jsonify, abort
from functools import wraps

from api.models import Application
from config import Config


def authenticate_request():
    """
    Middleware to authenticate incoming requests based on JWT tokens.
    """
    try:
        auth_header = request.headers.get('Authorization')
        if auth_header:
            token = auth_header.split(" ")[1] if " " in auth_header else auth_header
            decoded_token = jwt.decode(token, Config.SECRET_KEY, algorithms=['HS256'])

            if "app_names" in decoded_token:
                request.app_names = decoded_token["app_names"]
                request.user_id = decoded_token.get("token_name")
                request.is_api_token = True
            elif "sub" in decoded_token:
                request.user_id = decoded_token["sub"]
                request.app_names = None
                request.is_api_token = False
            else:
                raise jwt.InvalidTokenError("Invalid token structure")
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return jsonify({"error": "Invalid or expired token."}), 401


def require_user_token(f):
    """
    Decorator to restrict route access to user tokens only.
    """

    @wraps(f)
    def wrapper(*args, **kwargs):
        if getattr(request, 'is_api_token', False):
            return jsonify({"error": "Access denied. This route is restricted to user tokens only."}), 403
        return f(*args, **kwargs)

    return wrapper


def require_valid_app_ids(param_name=None, allow_multiple=True, source="kwargs"):
    """
    Decorator to validate that the app_ids in the request match the allowed app_names.

    :param param_name: Name of the parameter containing the app_id(s) (e.g. 'app_id' or 'app_ids')
    :param allow_multiple: Indicates whether multiple app_ids are allowed
    :param source: Source of the app_ids ('kwargs', 'args', or 'json')
    """

    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            app_names = getattr(request, 'app_names', None)
            if app_names:
                # Extract app_id(s) based on the specified source
                if source == "kwargs":
                    app_ids = kwargs.get(param_name)
                elif source == "args":
                    app_ids = request.args.get(param_name)
                elif source == "json":
                    data = request.json or {}
                    app_ids = data.get(param_name)
                else:
                    return abort(400, {"error": f"Invalid source: {source}"})

                if not app_ids:
                    return abort(400, {"error": f"{param_name} is required"})

                # Convert to list if multiple values are allowed
                app_id_list = app_ids.split(',') if allow_multiple and isinstance(app_ids, str) else [app_ids]

                # Retrieve valid app_ids from database
                valid_app_ids = [app.id for app in Application.query.filter(Application.name.in_(app_names)).all()]
                invalid_app_ids = [app_id for app_id in app_id_list if app_id not in valid_app_ids]

                if invalid_app_ids:
                    return abort(403, {"error": f"Unauthorized access to app_ids: {', '.join(invalid_app_ids)}"})

            return f(*args, **kwargs)

        return wrapper

    return decorator
