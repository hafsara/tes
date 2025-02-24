from marshmallow import fields, validate, Schema, validates, ValidationError
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema, auto_field

from .models import (
    FormContainer, Campaign, Application, Form, Question, Response,
    TimelineEntry, ConnectionLog, APIToken
)


class CampaignSchema(SQLAlchemyAutoSchema):
    """
    Schema for serializing and deserializing Campaign model.
    """

    class Meta:
        model = Campaign
        include_relationships = True
        load_instance = True

    id = auto_field()
    name = fields.Str(required=True, validate=validate.Length(max=255))
    created_at = fields.DateTime(dump_only=True)
    created_by = fields.Str(required=True)
    app_id = fields.Str(required=True)


class ApplicationSchema(SQLAlchemyAutoSchema):
    """
    Schema for serializing and deserializing Application model.
    """

    class Meta:
        model = Application
        include_relationships = True
        load_instance = True

    id = fields.Str(dump_only=True)
    name = fields.Str(required=True, validate=validate.Length(max=255))
    created_at = fields.DateTime(dump_only=True)
    created_by = fields.Str(required=True)
    mail_sender = fields.Str(validate=validate.Length(max=500), required=True)


class ApplicationUpdateSchema(Schema):
    """
    Schema for updating an application.
    """

    name = fields.Str(validate=validate.Length(max=255))
    new_mail_sender = fields.Str(validate=validate.Length(max=500))
    generate_new_id = fields.Bool(missing=False)


class QuestionSchema(SQLAlchemyAutoSchema):
    """
    Schema for serializing and deserializing questions related to a form.
    """

    class Meta:
        model = Question
        load_instance = True

    id = fields.Int(dump_only=True)
    label = fields.Str(required=True, validate=validate.Length(max=255))
    type = fields.Str(required=True, validate=validate.Length(max=50))
    options = fields.List(fields.Str(), required=False)
    is_required = fields.Boolean(default=True)
    response = fields.Raw(allow_none=True)


class ResponseSchema(SQLAlchemyAutoSchema):
    """
    Schema for serializing and deserializing responses related to a form.
    """

    class Meta:
        model = Response
        load_instance = True

    responder_uid = fields.Str(required=True)
    submitted_at = fields.DateTime(dump_only=True)
    answers = fields.List(fields.Dict(), required=True)


class FormSchema(Schema):
    """
    Schéma pour les formulaires individuels.
    """
    id = fields.Int(dump_only=True)
    status = fields.Str(required=False, validate=validate.Length(max=50))
    cancel_comment = fields.Str(allow_none=True, validate=validate.Length(max=1024))
    created_at = fields.DateTime(dump_only=True)
    questions = fields.List(fields.Dict(), required=True)


class FormSchemaSQL(SQLAlchemyAutoSchema):
    """
    Schema for serializing and deserializing forms inside a FormContainer.
    """

    class Meta:
        model = Form
        load_instance = True

    form_id = fields.Int(attribute="id", dump_only=True)
    status = fields.Str(required=True, validate=validate.Length(max=50))
    cancel_comment = fields.Str(allow_none=True, validate=validate.Length(max=1024))
    created_at = fields.DateTime(dump_only=True)
    questions = fields.Nested(QuestionSchema, many=True)
    responses = fields.Nested(ResponseSchema, many=True)


class FormContainerDetailSchema(SQLAlchemyAutoSchema):
    """
    Schema for serializing and deserializing FormContainer details.
    """

    class Meta:
        model = FormContainer
        include_fk = True
        load_instance = True

    id = fields.Int(dump_only=True)
    title = fields.Str(required=True, validate=validate.Length(max=255))
    description = fields.Str(required=True, validate=validate.Length(max=1024))
    user_email = fields.Email(required=True)
    escalade_email = fields.Email(allow_none=True)
    reference = fields.Str(allow_none=True, validate=validate.Length(max=255))
    cc_emails = fields.List(fields.Email(), allow_none=True)
    escalate = fields.Boolean(default=False)
    validated = fields.Boolean(default=False)
    reminder_delay = fields.Int(allow_none=True)
    initiated_by = fields.Str(required=True)
    created_at = fields.DateTime(dump_only=True)
    app_name = fields.Method("get_app_name")
    campaign_name = fields.Method("get_campaign_name")
    forms = fields.Nested(FormSchemaSQL, many=True)

    @validates("escalade_email")
    def validate_escalade_email(self, value):
        if value == "":
            return None
        return value

    def get_app_name(self, obj):
        return obj.application.name if obj.application else None

    def get_campaign_name(self, obj):
        return obj.campaign.name if obj.campaign else None


class FormContainerListSchema(SQLAlchemyAutoSchema):
    """
    Schema for serializing and deserializing a list of FormContainers.
    """

    class Meta:
        model = FormContainer
        include_fk = True
        load_instance = True

    id = fields.Int(dump_only=True)
    access_token = fields.Str(dump_only=True)
    title = fields.Str(required=True, validate=validate.Length(max=255))
    description = fields.Str(required=True, validate=validate.Length(max=1024))
    user_email = fields.Email(required=True)
    reference = fields.Str(allow_none=True, validate=validate.Length(max=255))
    escalate = fields.Boolean(default=False)
    validated = fields.Boolean(default=False)
    created_at = fields.DateTime(dump_only=True)
    app_name = fields.Method("get_app_name")
    campaign_name = fields.Method("get_campaign_name")
    escalade_email = fields.Str(required=False)

    @validates("escalade_email")
    def validate_escalade_email(self, value):
        if value and "@" not in value:
            raise ValidationError("Not a valid email address")

    def get_app_name(self, obj):
        return obj.application.name if obj.application else None

    def get_campaign_name(self, obj):
        return obj.campaign.name if obj.campaign else None


class FormContainerSchema(Schema):
    """
    Schéma classique pour la validation des FormContainers sans SQLAlchemy.
    """

    id = fields.Int(dump_only=True)
    access_token = fields.Str(dump_only=True)
    title = fields.Str(required=True, validate=validate.Length(max=255))
    description = fields.Str(required=True, validate=validate.Length(max=1024))
    user_email = fields.Email(required=True)
    escalade_email = fields.Email(allow_none=True)
    cc_emails = fields.List(fields.Email(), required=False)
    reference = fields.Str(allow_none=True)
    escalate = fields.Bool(default=False)
    validated = fields.Bool(dump_only=True)
    initiated_by = fields.Str(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
    reminder_delay = fields.Int(validate=validate.Range(min=0), required=False)
    app_id = fields.Str(allow_none=True)
    campaign_id = fields.Int(allow_none=True)
    archived_at = fields.DateTime(allow_none=True)
    forms = fields.List(fields.Nested(FormSchema), required=True)


class TimelineEntrySchema(SQLAlchemyAutoSchema):
    """
    Schema for serializing and deserializing TimelineEntry model.
    """

    class Meta:
        model = TimelineEntry
        include_relationships = True
        load_instance = True

    id = auto_field()
    form_container_id = fields.Int(required=True)
    form_id = fields.Int(required=True)
    event = fields.Str(required=True, validate=validate.Length(max=255))
    timestamp = fields.DateTime(dump_only=True)
    details = fields.Str(allow_none=True)


class ConnectionLogSchema(SQLAlchemyAutoSchema):
    """
    Schema for serializing and deserializing ConnectionLog model.
    """

    class Meta:
        model = ConnectionLog
        include_relationships = True
        load_instance = True

    id = auto_field()
    user_id = fields.Str(required=True)
    app_ids = fields.List(fields.Str(), required=True)
    timestamp = fields.DateTime(dump_only=True)


class APITokenSchema(SQLAlchemyAutoSchema):
    """
    Schema for serializing and deserializing API Tokens.
    """

    class Meta:
        model = APIToken
        include_relationships = True
        load_instance = True

    id = auto_field(dump_only=True)
    token_name = fields.Str(required=True, validate=validate.Length(max=50))
    token = fields.Str(dump_only=True)
    app_names = fields.List(fields.Str(), required=True)
    created_by = fields.Str(dump_only=True)
    expiration = fields.DateTime(required=True)
    created_at = fields.DateTime(dump_only=True)
