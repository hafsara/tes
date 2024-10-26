from extensions import db

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    is_superadmin = db.Column(db.Boolean, default=False)

class FormContainer(db.Model):
    __tablename__ = 'form_containers'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    manager_email = db.Column(db.String(120), nullable=False)
    ticket = db.Column(db.String(50))
    escalation = db.Column(db.Boolean, default=False)
    validated = db.Column(db.Boolean, default=False)

class Form(db.Model):
    __tablename__ = 'forms'
    id = db.Column(db.Integer, primary_key=True)
    form_container_id = db.Column(db.Integer, db.ForeignKey('form_containers.id'), nullable=False)
    fields = db.Column(db.JSON, nullable=False)
    response = db.Column(db.JSON)
    status = db.Column(db.String(50), default='open')
