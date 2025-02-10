from marshmallow import Schema, fields, validate, ValidationError
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema, auto_field
from .models import (
    FormContainer, Campaign, Application, Form, Question,
    Response, TimelineEntry, ConnectionLog, APIToken
)

class ApplicationSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Application
        include_relationships = True
        load_instance = True

    id = auto_field(dump_only=True)
    name = auto_field(required=True, validate=validate.Length(min=2, max=255))
    created_at = auto_field(dump_only=True)
    created_by = auto_field(dump_only=True)

class CampaignSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Campaign
        include_relationships = True
        load_instance = True

    id = auto_field(dump_only=True)
    name = auto_field(required=True, validate=validate.Length(min=2, max=255))
    created_at = auto_field(dump_only=True)
    created_by = auto_field(dump_only=True)
    app_id = auto_field(required=True)

class FormContainerSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = FormContainer
        include_relationships = True
        load_instance = True

    id = auto_field(dump_only=True)
    access_token = auto_field(dump_only=True)
    title = auto_field(required=True, validate=validate.Length(max=255))
    description = auto_field(required=True, validate=validate.Length(max=1024))
    user_email = auto_field(required=True, validate=validate.Email())
    escalade_email = auto_field(validate=validate.Email())
    cc_emails = fields.List(fields.Email(), required=False)
    reference = auto_field(required=False)
    escalate = auto_field(required=False, default=False)
    validated = auto_field(dump_only=True)
    initiated_by = auto_field(dump_only=True)
    created_at = auto_field(dump_only=True)
    updated_at = auto_field(dump_only=True)
    reminder_delay = auto_field(required=False, validate=validate.Range(min=0))
    app_id = auto_field(required=False)
    campaign_id = auto_field(required=False)

class FormSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Form
        include_relationships = True
        load_instance = True

    id = auto_field(dump_only=True)
    form_container_id = auto_field(required=True)
    status = auto_field(dump_only=True)
    cancel_comment = auto_field(required=False)
    created_at = auto_field(dump_only=True)

class QuestionSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Question
        include_relationships = True
        load_instance = True

    id = auto_field(dump_only=True)
    form_id = auto_field(required=True)
    label = auto_field(required=True, validate=validate.Length(max=255))
    type = auto_field(required=True, validate=validate.OneOf(['text', 'select', 'radio', 'checkbox']))
    options = fields.List(fields.String(), required=False)
    is_required = auto_field(required=False, default=True)
    response = fields.Dict(required=False)

class ResponseSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Response
        include_relationships = True
        load_instance = True

    id = auto_field(dump_only=True)
    form_id = auto_field(required=True)
    responder_uid = auto_field(required=True)
    submitted_at = auto_field(dump_only=True)
    answers = fields.Dict(required=True)

class TimelineEntrySchema(SQLAlchemyAutoSchema):
    class Meta:
        model = TimelineEntry
        include_relationships = True
        load_instance = True

    id = auto_field(dump_only=True)
    form_container_id = auto_field(required=True)
    form_id = auto_field(required=True)
    event = auto_field(required=True, validate=validate.Length(max=255))
    timestamp = auto_field(dump_only=True)
    details = auto_field(required=False)

class ConnectionLogSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = ConnectionLog
        include_relationships = True
        load_instance = True

    id = auto_field(dump_only=True)
    user_id = auto_field(required=True)
    app_ids = fields.List(fields.String(), required=True)
    timestamp = auto_field(dump_only=True)

class APITokenSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = APIToken
        include_relationships = True
        load_instance = True

    id = auto_field(dump_only=True)
    token_name = auto_field(required=True, validate=validate.Length(max=50))
    token = auto_field(dump_only=True)
    app_names = fields.List(fields.String(), required=True)
    created_by = auto_field(required=True)
    expiration = auto_field(required=True)
    created_at = auto_field(dump_only=True)