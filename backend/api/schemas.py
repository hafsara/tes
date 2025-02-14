from marshmallow import Schema, fields, validate
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema
from .models import (
    Application, Campaign, FormContainer, Form, Question,
    Response, TimelineEntry, ConnectionLog, APIToken
)


class ApplicationSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Application
        include_relationships = True
        load_instance = True

    id = fields.Str(dump_only=True)
    name = fields.Str(required=True, validate=validate.Length(min=2, max=255))
    created_at = fields.DateTime(dump_only=True)
    created_by = fields.Str(dump_only=True)
    mail_sender = fields.Str(required=False)


class CampaignSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Campaign
        include_relationships = True
        load_instance = True

    id = fields.Int(dump_only=True)
    name = fields.Str(required=True, validate=validate.Length(min=2, max=255))
    created_at = fields.DateTime(dump_only=True)
    created_by = fields.Str(dump_only=True)
    app_id = fields.Str(required=True)


class FormContainerSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = FormContainer
        include_relationships = True
        load_instance = True

    id = fields.Int(dump_only=True)
    access_token = fields.Str(dump_only=True)
    title = fields.Str(required=True, validate=validate.Length(max=255))
    description = fields.Str(required=True, validate=validate.Length(max=1024))
    user_email = fields.Str(required=True, validate=validate.Email())
    escalade_email = fields.Str(validate=validate.Email())
    cc_emails = fields.List(fields.Email(), required=False)
    reference = fields.Str(required=False)
    escalate = fields.Bool(required=False, default=False)
    validated = fields.Bool(dump_only=True)
    initiated_by = fields.Str(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
    reminder_delay = fields.Int(required=False, validate=validate.Range(min=0))
    app_id = fields.Str(required=False)
    campaign_id = fields.Int(required=False)


class FormSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Form
        include_relationships = True
        load_instance = True

    id = fields.Int(dump_only=True)
    form_container_id = fields.Int(required=True)
    status = fields.Str(dump_only=True)
    cancel_comment = fields.Str(required=False)
    created_at = fields.DateTime(dump_only=True)


class QuestionSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Question
        include_relationships = True
        load_instance = True

    id = fields.Int(dump_only=True)
    form_id = fields.Int(required=True)
    label = fields.Str(required=True, validate=validate.Length(max=255))
    type = fields.Str(required=True, validate=validate.OneOf(['text', 'select', 'radio', 'checkbox']))
    options = fields.List(fields.String(), required=False)
    is_required = fields.Bool(required=False, default=True)
    response = fields.Dict(required=False)


class ResponseSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Response
        include_relationships = True
        load_instance = True

    id = fields.Int(dump_only=True)
    form_id = fields.Int(required=True)
    responder_uid = fields.Str(required=True)
    submitted_at = fields.DateTime(dump_only=True)
    answers = fields.Dict(required=True)


class TimelineEntrySchema(SQLAlchemyAutoSchema):
    class Meta:
        model = TimelineEntry
        include_relationships = True
        load_instance = True

    id = fields.Int(dump_only=True)
    form_container_id = fields.Int(required=True)
    form_id = fields.Int(required=True)
    event = fields.Str(required=True, validate=validate.Length(max=255))
    timestamp = fields.DateTime(dump_only=True)
    details = fields.Str(required=False)


class ConnectionLogSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = ConnectionLog
        include_relationships = True
        load_instance = True

    id = fields.Int(dump_only=True)
    user_id = fields.Str(required=True)
    app_ids = fields.List(fields.String(), required=True)
    timestamp = fields.DateTime(dump_only=True)


class APITokenSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = APIToken
        include_relationships = True
        load_instance = True

    id = fields.Int(dump_only=True)
    token_name = fields.Str(required=True, validate=validate.Length(max=50))
    token = fields.Str(dump_only=True)
    app_names = fields.List(fields.String(), required=True)
    created_by = fields.Str(required=True)
    expiration = fields.DateTime(required=True)
    created_at = fields.DateTime(dump_only=True)

class TokenValidationSchema(Schema):
    is_valid = fields.Bool(required=True)
    token = fields.Str(required=False)