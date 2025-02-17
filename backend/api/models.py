import uuid
from datetime import datetime

from .extensions import db


class FormContainer(db.Model):
    __tablename__ = 'form_containers'
    __table_args__ = (db.Index('idx_form_container_access_token', 'access_token'),)

    id = db.Column(db.Integer, primary_key=True)
    access_token = db.Column(db.String(36), unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.String(1024), nullable=False)
    user_email = db.Column(db.String(255), nullable=False)
    escalade_email = db.Column(db.String(255), nullable=True)
    cc_emails = db.Column(db.JSON, nullable=True)
    reference = db.Column(db.String(255), nullable=True)
    escalate = db.Column(db.Boolean, default=False)
    validated = db.Column(db.Boolean, default=False)
    initiated_by = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    reminder_delay = db.Column(db.Integer, nullable=True)
    app_id = db.Column(db.String(36), db.ForeignKey('application.id'), nullable=True)
    campaign_id = db.Column(db.Integer, db.ForeignKey('campaign.id'), nullable=True)
    archived_at = db.Column(db.DateTime, nullable=True)

    application = db.relationship('Application', backref='form_containers')
    campaign = db.relationship('Campaign', backref='form_containers')
    timeline = db.relationship('TimelineEntry', backref='form_containers', lazy=True)
    forms = db.relationship('Form', backref='form_containers', lazy=True)


class Campaign(db.Model):
    __tablename__ = 'campaign'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.String(255), nullable=False)
    app_id = db.Column(db.String(36), db.ForeignKey('application.id'), nullable=False)


class Application(db.Model):
    __tablename__ = 'application'
    id = db.Column(db.String(36), unique=True, nullable=False, primary_key=True)
    name = db.Column(db.String(255), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.String(255), nullable=False)
    mail_sender = db.Column(db.String(500), nullable=True, default='hafsaraii@gmail.com')


class Form(db.Model):
    __tablename__ = 'forms'
    id = db.Column(db.Integer, primary_key=True)
    form_container_id = db.Column(db.Integer, db.ForeignKey('form_containers.id'), nullable=False)
    status = db.Column(db.String(50), nullable=False, default='open')
    cancel_comment = db.Column(db.String(1024), nullable=True)
    questions = db.relationship('Question', backref='form', lazy=True, cascade="all, delete-orphan")
    responses = db.relationship('Response', backref='form', lazy=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    # workflow_step = db.Column(db.String(50), nullable=True)

    def __repr__(self):
        return f"<Form {self.id} for Container {self.form_container_id}>"


class Question(db.Model):
    __tablename__ = 'questions'
    id = db.Column(db.Integer, primary_key=True)
    form_id = db.Column(db.Integer, db.ForeignKey('forms.id'), nullable=False)
    label = db.Column(db.String(255), nullable=False)
    type = db.Column(db.String(50), nullable=False)
    options = db.Column(db.JSON, nullable=True)
    is_required = db.Column(db.Boolean, default=True)
    response = db.Column(db.JSON, nullable=True)

    def __repr__(self):
        return f"<Question {self.id} for Form {self.form_id}>"


class Response(db.Model):
    __tablename__ = 'responses'
    id = db.Column(db.Integer, primary_key=True)
    form_id = db.Column(db.Integer, db.ForeignKey('forms.id'), nullable=False)
    responder_uid = db.Column(db.String(255), nullable=False)
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)
    answers = db.Column(db.JSON, nullable=False)


class TimelineEntry(db.Model):
    __tablename__ = 'timeline_entries'
    id = db.Column(db.Integer, primary_key=True)
    form_container_id = db.Column(db.Integer, db.ForeignKey('form_containers.id'), nullable=False)
    form_id = db.Column(db.Integer, db.ForeignKey('forms.id'), nullable=False)
    event = db.Column(db.String(255), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    details = db.Column(db.Text, nullable=True)


class ConnectionLog(db.Model):
    __tablename__ = 'connection_logs'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(50), nullable=False)
    app_ids = db.Column(db.JSON, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)


class APIToken(db.Model):
    __tablename__ = 'api_tokens'

    id = db.Column(db.Integer, primary_key=True)
    token_name = db.Column(db.String(50), nullable=False, unique=True)
    token = db.Column(db.String, nullable=False, unique=True)
    app_names = db.Column(db.JSON, nullable=False)
    created_by = db.Column(db.String, nullable=False)
    expiration = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
