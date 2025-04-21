import os
from .common_settings import *  # noqa: F403

ALLOWED_HOSTS = [os.environ["WEBSITE_HOSTNAME"]] if "WEBSITE_HOSTNAME" in os.environ else []
allowed_origins = ["https://" + os.environ["FRONTEND_HOSTNAME"]] if "FRONTEND_HOSTNAME" in os.environ else []
CORS_ALLOWED_ORIGINS = allowed_origins
CSRF_TRUSTED_ORIGINS = allowed_origins
SECRET_KEY = os.environ.get("SECRET_KEY")

DEBUG = False

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql_psycopg2",
        "OPTIONS": {"options": f"-c search_path={os.environ.get('DB_SCHEMA')}"},
        "NAME": os.environ.get("DB_NAME"),
        "USER": os.environ.get("DB_USER"),
        "PASSWORD": os.environ.get("DB_PASSWORD"),
        "HOST": os.environ.get("DB_HOST"),
        "PORT": os.environ.get("DB_PORT"),
    }
}
