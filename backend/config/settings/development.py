"""Local development settings."""

import os

from .base import *  # noqa: F403

DEBUG = os.environ.get("DJANGO_DEBUG", "true").lower() == "true"

_database_url = os.environ.get("DATABASE_URL")

if _database_url:
    # Neon PostgreSQL when DATABASE_URL is set (Phase 2+)
    import re

    match = re.match(
        r"postgresql://(?P<user>[^:]+):(?P<password>[^@]+)@(?P<host>[^:/]+)(?::(?P<port>\d+))?/(?P<name>.+)",
        _database_url,
    )
    if not match:
        raise ValueError("DATABASE_URL must be a postgresql:// URL")
    DATABASES = {  # noqa: F405
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": match.group("name").split("?")[0],
            "USER": match.group("user"),
            "PASSWORD": match.group("password"),
            "HOST": match.group("host"),
            "PORT": match.group("port") or "5432",
            "OPTIONS": {"sslmode": "require"},
        }
    }
else:
    # Phase 1 local checks without Neon
    DATABASES = {  # noqa: F405
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",  # noqa: F405
        }
    }

SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False

# Use in-memory S3 double for local dev/tests without AWS credentials.
PRODUCT_IMAGE_STORAGE_BACKEND = os.environ.get(
    "PRODUCT_IMAGE_STORAGE_BACKEND", "memory"
)
