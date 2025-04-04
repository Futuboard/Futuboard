"""
Settings for running tests. Creates test database and uses it for running tests.
"""

from .settings import *  # noqa: F403
from .settings import BASE_DIR

DISABLE_AUTH_TOKEN_CHECKING = True  # Disable authentication for testing purposes

# Test database
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "tests/test_db.sqlite3",
    }
}
