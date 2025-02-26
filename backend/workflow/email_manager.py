import os

from jinja2 import Template
from flask_mail import Message
from api.extensions import mail

from config import Config


class MailManager:

    @staticmethod
    def prepare_subject(title, workflow_step='start'):
        if workflow_step == 'start':
            return f"[FOURAS] {title}"
        return f"[FOURAS][{workflow_step.upper()}]: {title}"

    @staticmethod
    def prepare_body(access_token, questions=None):
        link = f"{Config.APP_URL}/user-view/{access_token}"
        template_filename = "summary_mail.html" if questions else "notification_mail.html"
        base_dir = os.path.dirname(os.path.abspath(__file__))
        template_path = os.path.join(base_dir, "templates", template_filename)
        with open(template_path, encoding="utf-8") as file:
            template_content = file.read()

        template = Template(template_content)
        return template.render(form_url=link, questions=questions)

    @staticmethod
    def send_email(mail_sender, to, cc, title, access_token, questions=None, workflow_step='start'):
        msg = Message(
            subject=MailManager.prepare_subject(title, workflow_step),
            sender=mail_sender,
            recipients=[to],
            cc=cc
        )
        msg.html = MailManager.prepare_body(access_token, questions)
        mail.send(msg)
