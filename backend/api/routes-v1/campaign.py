from flask import Blueprint, request, jsonify
from marshmallow import ValidationError

from api.models import Campaign
from api.extensions import db
from api.schemas import CampaignSchema
from api.decorators.auth import authenticate_request
from api.decorators.validation import require_valid_app_ids
from api.helpers.tools import error_response

campaign_bp = Blueprint('campaign', __name__)
campaign_schema = CampaignSchema()


@campaign_bp.before_request
def before_request():
    return authenticate_request()


@campaign_bp.route('/', methods=['POST'])
@require_valid_app_ids(param_name="app_id", source="json", allow_multiple=False)
def create_campaign():
    """
    Create a new campaign.
    """
    data = request.json

    try:
        validated_data = campaign_schema.load(data)
    except ValidationError as err:
        return error_response(err.messages, 400)

    campaign_name = validated_data.get('name')
    app_id = validated_data.get('app_id')
    created_by = getattr(request, 'user_id', None)

    if not created_by:
        return error_response("User not authenticated", 401)

    if not campaign_name or not app_id:
        return error_response("Campaign name and app ID are required", 400)

    campaign = Campaign(name=campaign_name, app_id=app_id, created_by=created_by)
    db.session.add(campaign)
    db.session.commit()
    result = campaign_schema.dump(campaign)

    return jsonify({"message": "Campaign created successfully", "campaign": result}), 201


@campaign_bp.route('/', methods=['GET'])
def get_campaigns():
    campaigns = Campaign.query.all()
    result = campaign_schema.dump(campaigns, many=True)
    return jsonify(result), 200
