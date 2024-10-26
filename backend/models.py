from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import base64

db = SQLAlchemy()


class FormContainer(db.Model):
    __tablename__ = 'form_containers'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    user_email = db.Column(db.String(100), nullable=False)
    manager_email = db.Column(db.String(100), nullable=False)
    ticket = db.Column(db.String(50), nullable=True)
    escalation = db.Column(db.Boolean, default=False)
    validated = db.Column(db.Boolean, default=False)
    initiated_by = db.Column(db.Integer, nullable=False)  # ID du SuperAdmin
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)

    # Relation avec les formulaires (chaque FormContainer peut contenir plusieurs formulaires)
    forms = db.relationship('Form', backref='form_container', cascade="all, delete-orphan", lazy=True)


class Form(db.Model):
    __tablename__ = 'forms'
    id = db.Column(db.Integer, primary_key=True)
    form_container_id = db.Column(db.Integer, db.ForeignKey('form_containers.id'), nullable=False)
    fields = db.Column(db.JSON, nullable=False)  # Champs dynamiques du formulaire
    response = db.Column(db.JSON, nullable=True)  # Réponse du formulaire
    responder_email = db.Column(db.String(100), nullable=True)  # Email du User ayant répondu au formulaire
    status = db.Column(db.String(50), default='open')  # Statut du formulaire ('open', 'answered', etc.)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)


def generate_form_container_link(container_id):
    encoded_id = base64.urlsafe_b64encode(str(container_id).encode()).decode()
    return f"https://yourdomain.com/form-container/{encoded_id}"
