import os


class Config:

    SECRET_KEY = os.getenv('SECRET_KEY', 'your_secret_key')
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    MAIL_SUPPRESS_SEND = True
    SWAGGER_URL = '/api/docs'
    API_URL = '/static/swagger.yml'
    OAUTH_CLIENT_ID = os.environ.get('OAUTH_CLIENT_ID')
    OAUTH_CLIENT_SECRET = os.environ.get('OAUTH_CLIENT_SECRET')
    OAUTH_PROVIDER = "https://provider.example.com"
    CELERY_BROKER_URL = 'redis://localhost:6379/0'
    CELERY_RESULT_BACKEND = 'redis://localhost:6379/0'
    APP_URL = 'https://yourapp.com'
    ARCHIVE_DELAY_DAYS = 90

class TestConfig:
    SECRET_KEY = os.getenv('SECRET_KEY', 'your_secret_key')
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    MAIL_SUPPRESS_SEND = True
    SWAGGER_URL = '/api/docs'
    API_URL = '/static/swagger.yml'
    OAUTH_CLIENT_ID = os.environ.get('OAUTH_CLIENT_ID')
    OAUTH_CLIENT_SECRET = os.environ.get('OAUTH_CLIENT_SECRET')
    OAUTH_PROVIDER = "https://provider.example.com"
    CELERY_BROKER_URL = 'redis://localhost:6379/0'
    CELERY_RESULT_BACKEND = 'redis://localhost:6379/0'
    APP_URL = 'https://yourapp.com'
    ARCHIVE_DELAY_DAYS = 90
