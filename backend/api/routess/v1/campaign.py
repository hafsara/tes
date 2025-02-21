from flask import Blueprint, request, jsonify
from marshmallow import ValidationError

from api.routess.auth_decorators import require_valid_app_ids, require_user_token
from api.schemas import CampaignSchema
from api.extensions import db
from api.models import Campaign

from api.helpers.tools import error_response

campaign_bp = Blueprint("campaign_bp", __name__)


@campaign_bp.route("/campaigns", methods=["POST"])
@require_valid_app_ids(param_name="app_id", source="json", allow_multiple=False)
def create_campaign():
    """
    Create a new campaign.
    Requires a valid `app_id` associated with the user and a campaign name.
    """
    data = request.json
    created_by = getattr(request, 'user_id', None)

    if not created_by:
        return error_response("User not authenticated", 401)

    data['created_by'] = created_by
    schema = CampaignSchema(session=db.session)

    try:
        validated_data = schema.load(data)
    except ValidationError as err:
        return error_response(err.messages, 400)

    new_campaign = Campaign(
        name=validated_data.name,
        app_id=validated_data.app_id,
        created_by=created_by,
    )
    db.session.add(new_campaign)
    db.session.commit()

    return jsonify({"message": "Campaign created successfully", "campaign_id": new_campaign.id}), 201


@campaign_bp.route('/campaigns/<string:app_id>', methods=['GET'])
@require_valid_app_ids(param_name="app_id", source="args", allow_multiple=False)
def get_campaigns(app_id):
    """
    Retrieve all campaigns linked to a specific application ID.
    """
    campaigns = Campaign.query.filter_by(app_id=app_id).all()
    schema = CampaignSchema(session=db.session, many=True)

    return jsonify(schema.dump(campaigns)), 200


@campaign_bp.route("/campaigns/<int:campaign_id>", methods=["PUT"])
@require_valid_app_ids(param_name="app_id", source="json", allow_multiple=False)
def update_campaign(campaign_id):
    """
    Update a campaign name.
    """
    data = request.json
    schema = CampaignSchema(session=db.session, partial=True)

    try:
        validated_data = schema.load(data)
    except ValidationError as err:
        return error_response(err.messages, 400)

    campaign = Campaign.query.filter_by(app_id=validated_data.app_id, id=campaign_id).first_or_404()

    if validated_data.name:
        campaign.name = validated_data.name

    db.session.commit()

    return jsonify({"message": "Campaign updated successfully", "campaign_id": campaign.id}), 200


@campaign_bp.route("/campaigns/<int:campaign_id>", methods=["DELETE"])
@require_user_token
def delete_campaign(campaign_id):
    """
    Delete a campaign by its ID.
    """
    data = request.json
    campaign = Campaign.query.get_or_404(app_id=data.get("app_id"), id=campaign_id)

    db.session.delete(campaign)
    db.session.commit()

    return jsonify({"message": "Campaign deleted successfully", "campaign_id": campaign_id}), 200
