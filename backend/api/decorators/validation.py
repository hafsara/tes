from functools import wraps
from flask import request, jsonify
from api.models import Application

from marshmallow import Schema, fields, ValidationError

class AppIdsSchema(Schema):
    app_ids = fields.List(fields.Str(), required=True)

def require_valid_app_ids(param_name=None, allow_multiple=True, source="kwargs"):
    """
    Décorateur pour valider que les app_ids dans la requête correspondent aux app_names autorisés.
    """
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            app_names = getattr(request, 'app_names', None)
            if app_names:
                if source == "kwargs":
                    app_ids = kwargs.get(param_name)
                elif source == "args":
                    app_ids = request.args.get(param_name)
                elif source == "json":
                    data = request.json or {}
                    app_ids = data.get(param_name)
                else:
                    return jsonify({"error": f"Invalid source: {source}"}), 400

                # Valider les app_ids avec le schéma
                schema = AppIdsSchema()
                try:
                    schema.load({"app_ids": app_ids.split(',') if allow_multiple and isinstance(app_ids, str) else [app_ids]})
                except ValidationError as err:
                    return jsonify({"error": err.messages}), 400

                # Récupérer les app_ids valides à partir des app_names autorisés
                valid_app_ids = [app.id for app in Application.query.filter(Application.name.in_(app_names)).all()]
                invalid_app_ids = [app_id for app_id in app_ids if app_id not in valid_app_ids]

                if invalid_app_ids:
                    return jsonify({"error": f"Unauthorized access to app_ids: {', '.join(invalid_app_ids)}"}), 403

            return f(*args, **kwargs)
        return wrapper
    return decorator