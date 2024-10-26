import smtplib
from email.mime.text import MIMEText
from config import Config

def send_email(to, subject, body, link=None):
    message = MIMEText(f"{body}\n\nLien d'accès : {link}" if link else body)
    message["Subject"] = subject
    message["From"] = Config.EMAIL_FROM
    message["To"] = to

    with smtplib.SMTP(Config.SMTP_SERVER, Config.SMTP_PORT) as server:
        server.starttls()
        server.login(Config.SMTP_USERNAME, Config.SMTP_PASSWORD)
        server.sendmail(Config.EMAIL_FROM, to, message.as_string())
