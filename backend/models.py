# models.py
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class SuperAdmin(db.Model):
    __tablename__ = 'super_admins'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String, unique=True, nullable=False)
    name = db.Column(db.String, nullable=False)


class FormContainer(db.Model):
    __tablename__ = 'form_containers'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String, nullable=False)
    user_email = db.Column(db.String, nullable=False)
    manager_email = db.Column(db.String, nullable=False)
    ticket = db.Column(db.String)
    escalation = db.Column(db.Boolean, default=False)
    initiated_by = db.Column(db.Integer, db.ForeignKey('super_admins.id'), nullable=False)
    validated = db.Column(db.Boolean, default=False)

    super_admin = db.relationship('SuperAdmin', backref='form_containers')


class Form(db.Model):
    __tablename__ = 'forms'
    id = db.Column(db.Integer, primary_key=True)
    form_container_id = db.Column(db.Integer, db.ForeignKey('form_containers.id'), nullable=False)
    fields = db.Column(db.JSON, nullable=False)  # Structure du formulaire (champs dynamiques)
    response = db.Column(db.JSON)  # Réponse de l'utilisateur
    responder_id = db.Column(db.String, nullable=True)  # UID SSO ou email de la personne ayant répondu
    status = db.Column(db.String(50), default='open')

    form_container = db.relationship('FormContainer', backref='forms')
