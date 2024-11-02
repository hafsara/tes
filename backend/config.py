import os


class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'your_secret_key')
    SQLALCHEMY_DATABASE_URI = 'postgresql://hafsa:toto@localhost/formulaire_db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Celery configuration (utilisé pour les rappels et escalades)
    CELERY_BROKER_URL = 'redis://localhost:6379/0'
    CELERY_RESULT_BACKEND = 'redis://localhost:6379/0'

    # Configuration OAuth
    OAUTH_CLIENT_ID = os.environ.get('OAUTH_CLIENT_ID')
    OAUTH_CLIENT_SECRET = os.environ.get('OAUTH_CLIENT_SECRET')
    OAUTH_PROVIDER = "https://provider.example.com"

    SWAGGER_URL = '/api/docs'
    API_URL = '/static/swagger.json'

    # Configuration de mail
    SMTP_SERVER = 'smtp.example.com'
    SMTP_PORT = 587
    SMTP_USERNAME = 'user@example.com'
    SMTP_PASSWORD = 'password'
    EMAIL_FROM = 'no-reply@example.com'
    REMINDER_DELAY_DAYS = 3
    APP_URL = 'https://yourapp.com'
