from flask import Blueprint, request, jsonify
from marshmallow import ValidationError

from api.extensions import db
from api.helpers.tools import error_response
from api.routes.auth_decorators import require_valid_app_ids
from api.models import Workflow

from api.schemas import WorkflowSchema

workflow_bp = Blueprint("workflow_bp", __name__)


@workflow_bp.route('/workflows', methods=['POST'])
@require_valid_app_ids(param_name='app_id', source="json", allow_multiple=False)
def create_workflow():
    """
    Create a new form container.
    """
    data = request.json
    schema = WorkflowSchema(session=db.session)

    try:
        validated_data = schema.load(data)
    except ValidationError as err:
        return error_response(err.messages, 400)

    user_id = getattr(request, 'user_id', None)
    if not user_id:
        return error_response("User not authenticated", 401)

    workflow = Workflow(name=validated_data.name, steps=validated_data.steps, created_by=user_id)

    db.session.add(workflow)
    db.session.commit()

    return jsonify({"id": workflow.id, "name": workflow.name, "created_by": workflow.created_by}), 201


@workflow_bp.route('/workflows', methods=['GET'])
@require_valid_app_ids(param_name='app_id', source="json", allow_multiple=False)
def get_workflows():
    """
    Retrieve all workflows.
    """
    user_id = getattr(request, "user_id", None)
    if not user_id:
        return error_response("User not authenticated", 401)

    workflows = Workflow.query.all()
    workflows_data = [
        {
            "id": w.id,
            "name": w.name,
            "steps": w.steps,
            "created_by": w.created_by,
            "created_at": w.created_at.isoformat() if w.created_at else None
        }
        for w in workflows
    ]

    return jsonify(workflows_data), 200


@workflow_bp.route('/workflows/<string:workflow_id>', methods=['DELETE'])
@require_valid_app_ids(param_name='app_id', source="json", allow_multiple=False)
def delete_workflow(workflow_id):
    """
    Delete workflow from id.
    """
    user_id = getattr(request, 'user_id', None)
    if not user_id:
        return error_response("User not authenticated", 401)

    workflow = Workflow.query.get(workflow_id)

    if not workflow:
        return error_response("Workflow not found", 404)

    db.session.delete(workflow)
    db.session.commit()

    return jsonify({"message": "Workflow deleted successfully"}), 200
