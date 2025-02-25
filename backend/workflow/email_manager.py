from jinja2 import Template
from flask_mail import Message
from api.extensions import mail

class MailManager:

    @staticmethod
    def prepare_subject(title, workflow_step='start'):
        if workflow_step == 'start':
            return f"[FOURAS] {title}"
        return f"[FOURAS][{workflow_step.upper()}]: {title}"

    @staticmethod
    def prepare_body(access_token, questions=None):
        link = f"http/localhost:4200/user-view/{access_token}"
        template_path = "C:\\Users\hafsa\\PycharmProjects\\juratus_form1\\backend\workflow\\templates\summary_mail.html" if questions else "C:\\Users\hafsa\\PycharmProjects\\juratus_form1\\backend\workflow\\templates/notification_mail.html"
        with open(template_path) as file:
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
