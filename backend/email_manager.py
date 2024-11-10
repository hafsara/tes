import smtplib
from email.mime.text import MIMEText
from config import Config


class MailManager:
    def __init__(self):
        self.smtp_server = Config.SMTP_SERVER
        self.smtp_port = Config.SMTP_PORT
        self.smtp_username = Config.SMTP_USERNAME
        self.smtp_password = Config.SMTP_PASSWORD
        self.email_form = Config.EMAIL_FROM

    def send_email(self, to, subject, body, link=None):
        message = MIMEText(f"{body}\n\nLien d'accès : {link}" if link else body)
        message["Subject"] = subject
        message["From"] = self.email_form
        message["To"] = to

        with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
            server.starttls()
            server.login(self.smtp_username, self.smtp_password)
            server.sendmail(self.email_form, to, message.as_string())


def send_email(to, subject, body, link=None):
    print(f"to {to}, subject {subject}, body {body}, link {link}")