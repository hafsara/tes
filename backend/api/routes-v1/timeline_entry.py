from flask import Blueprint, jsonify
from api.models import TimelineEntry
from api.schemas import TimelineEntrySchema
from api.decorators.auth import authenticate_request

timeline_entry_bp = Blueprint('timeline_entry', __name__)
timeline_entry_schema = TimelineEntrySchema(many=True)


@timeline_entry_bp.before_request
def before_request():
    return authenticate_request()


@timeline_entry_bp.route('/<int:form_container_id>', methods=['GET'])
def get_timeline(form_container_id):
    entries = TimelineEntry.query.filter_by(form_container_id=form_container_id).all()
    result = timeline_entry_schema.dump(entries)
    return jsonify(result), 200
