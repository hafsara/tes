import logging
import re
from datetime import datetime

import jwt
from flask import jsonify

from api.helpers.connector import Connector

# Configuration du logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Constantes
ESCALADE_EMAIL_MAPPING = {
    "@MANAGER": "SELECT TOP 1 ec.PERSONNE_EMAIL_GROUPE AS email_manager "
                "FROM SECSI_EchonetUsers ec "
                "JOIN SECSI_SNUsers_Groups g ON g.uid = ec.i_uid "
                "WHERE ec.PERSONNE_EMAIL_GROUPE = '{user_mail}'",
    "@CISO": "SELECT * FROM where sent = '0'",
    "@PSIRT": "emea.cib.csirt.and.monitoring@bnpparibas.com"
}
CONNECTOR_CONFIG = {
    "redis": {
        "host": "localhost",
        "port": 6379,
        "db": 0
    },
}
connector = Connector(CONNECTOR_CONFIG)


def error_response(message, status_code):
    return jsonify({"error": message}), status_code


def search_mail(user_mail, mail):
    """
    Recherche l'adresse email correspondante selon le rôle.
    """
    database = None
    logger.info(f"Recherche pour user_mail: {user_mail}, mail: {mail}")

    if mail.upper() in ESCALADE_EMAIL_MAPPING:
        sql_req = ESCALADE_EMAIL_MAPPING[mail.upper()]
        if "SELECT" in sql_req:  # Si la requête est SQL
            sql_req = sql_req.format(user_mail=user_mail)
            result = database.query_db(sql_req)
            if result:
                logger.info(f"Email trouvé : {result[0][0]}")
                return result[0][0]
        else:  # Si c'est une adresse statique
            return sql_req

    logger.warning(f"Aucune correspondance pour {mail}")
    return ""


def get_eq_emails(user_email, escalade_email, cc_emails=None):
    """
    Traite les emails d'escalade et les emails en copie (CC).
    """
    if cc_emails is None:
        cc_emails = []

    cc_emails_list = []

    # Traiter escalade_email
    if escalade_email.upper() in ESCALADE_EMAIL_MAPPING:
        escalade_email = search_mail(user_email, escalade_email)

    # Traiter cc_emails
    for mail in cc_emails:
        if mail.upper() in ESCALADE_EMAIL_MAPPING:
            cc_email = search_mail(user_email, mail)
            cc_emails_list.append(cc_email)
        else:
            cc_emails_list.append(mail)

    return escalade_email, cc_emails_list


def ensure_admin_application_exists():
    """
    Vérifie si l'application Admin existe, sinon la crée.
    """
    from api.models import Application
    from api.extensions import db  # Assurez-vous d'importer vos extensions

    admin_app = Application.query.filter_by(id='admin-test').first()
    if not admin_app:
        new_admin_app = Application(id='admin-test', name="admin", created_by="system", mail_sender="test@exemple.com")
        db.session.add(new_admin_app)
        db.session.commit()


def is_valid_email(email):
    """ Vérifier si l'email est valide """
    email_regex = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    return re.match(email_regex, email)


def generate_token(application):
    payload = {'application_name': application.name, 'app_id': application.id}
    token = jwt.encode(payload, 'your_secret_key', algorithm='HS256')
    return token


def log_timeline_event(form_container_id, form_id, event, details):
    from api.models import TimelineEntry
    from api.extensions import db

    timeline_entry = TimelineEntry(
        form_container_id=form_container_id,
        form_id=form_id,
        event=event,
        details=details,
        timestamp=datetime.utcnow()
    )
    db.session.add(timeline_entry)
    connector.send_event('channel', event)
