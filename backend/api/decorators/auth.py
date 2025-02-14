from functools import wraps
from flask import request, jsonify
import jwt

def authenticate_request():
    """
    Middleware to authenticate requests before they reach routes-v1.
    """
    try:
        auth_header = request.headers.get('Authorization')
        if auth_header:
            token = auth_header.split(" ")[1] if " " in auth_header else auth_header
            decoded_token = jwt.decode(token, 'your_secret_key', algorithms=['HS256'])

            if "app_names" in decoded_token:
                request.app_names = decoded_token["app_names"]
                request.user_id = decoded_token.get("token_name")
                request.is_api_token = True
            elif "sub" in decoded_token:
                request.user_id = decoded_token["sub"]
                request.app_names = None
                request.is_api_token = False
            else:
                raise "Invalid token structure"
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return jsonify({"error": "Invalid or expired token."}), 401


def require_user_token(f):
    """
    Decorator to restrict route access to user tokens only.
    """
    @wraps(f)
    def wrapper(*args, **kwargs):
        if getattr(request, 'is_api_token', False):
            return "Access denied. This route is restricted to user tokens only"
        return f(*args, **kwargs)
    return wrapper