import os
from .settings import *  # noqa: F403

allowed_origins = ["https://" + os.environ["FRONTEND_HOSTNAME"]] if "FRONTEND_HOSTNAME" in os.environ else []
ALLOWED_HOSTS = allowed_origins
CORS_ALLOWED_ORIGINS = allowed_origins
CSRF_TRUSTED_ORIGINS = allowed_origins
SECRET_KEY = os.environ.get("SECRET_KEY")

DEBUG = False

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql_psycopg2",
        "OPTIONS": {"options": "-c search_path=development"},
        "NAME": os.environ.get("DB_NAME"),
        "USER": os.environ.get("DB_USER"),
        "PASSWORD": os.environ.get("DB_PASSWORD"),
        "HOST": os.environ.get("DB_HOST"),
        "PORT": os.environ.get("DB_PORT"),
    }
}
