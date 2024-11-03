from extensions import db
from datetime import datetime
import base64
import os
import hashlib


class FormContainer(db.Model):
    __tablename__ = 'form_containers'
    # todo __table_args__ = (db.Index('idx_form_container_id', 'form_container_id'),)
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    user_email = db.Column(db.String(100), nullable=False)
    manager_email = db.Column(db.String(100), nullable=False)
    reference = db.Column(db.String(50), nullable=True)
    escalate = db.Column(db.Boolean, default=False)
    validated = db.Column(db.Boolean, default=False)
    initiated_by = db.Column(db.String(50), nullable=False)
    unique_link = db.Column(db.String(200), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)

    forms = db.relationship('Form', backref='form_container', cascade="all, delete-orphan", lazy=True)

    def generate_unique_link(self):
        # todo changer cette fonction
        """Generates a unique link for the form container."""
        random_data = os.urandom(16)
        hash_object = hashlib.sha256(random_data)
        self.unique_link = hash_object.hexdigest()

    def save(self):
        if not self.unique_link:
            self.generate_unique_link()
        db.session.add(self)
        db.session.commit()


class Form(db.Model):
    __tablename__ = 'forms'
    id = db.Column(db.Integer, primary_key=True)
    form_container_id = db.Column(db.Integer, db.ForeignKey('form_containers.id'), nullable=False)
    questions = db.Column(db.JSON, nullable=False)
    response = db.Column(db.JSON, nullable=True)
    responder_uid = db.Column(db.String(100), nullable=True)
    status = db.Column(db.String(50), default='open')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)


def generate_form_container_link(container_id):
    encoded_id = base64.urlsafe_b64encode(str(container_id).encode()).decode()
    return f"https://yourdomain.com/form-container/{encoded_id}"
