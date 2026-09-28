"""Production settings for EC2 + Neon (ADR-0006)."""

import os
import re

from .base import *  # noqa: F403

# Production must never run with DEBUG enabled (ignore DJANGO_DEBUG from .env).
DEBUG = False

SECRET_KEY = os.environ["DJANGO_SECRET_KEY"]

_allowed = [
    h.strip()
    for h in os.environ.get("DJANGO_ALLOWED_HOSTS", os.environ.get("ALLOWED_HOSTS", "")).split(
        ","
    )
    if h.strip()
]
if not _allowed:
    raise ValueError("DJANGO_ALLOWED_HOSTS (or ALLOWED_HOSTS) is required in production")
ALLOWED_HOSTS = _allowed

_cors = [
    o.strip() for o in os.environ.get("CORS_ALLOWED_ORIGINS", "").split(",") if o.strip()
]
_csrf = [
    o.strip() for o in os.environ.get("CSRF_TRUSTED_ORIGINS", "").split(",") if o.strip()
]
if not _cors or not _csrf:
    raise ValueError("CORS_ALLOWED_ORIGINS and CSRF_TRUSTED_ORIGINS are required in production")
CORS_ALLOWED_ORIGINS = _cors
CSRF_TRUSTED_ORIGINS = _csrf

_database_url = os.environ.get("DATABASE_URL")
if not _database_url:
    raise ValueError("DATABASE_URL is required in production")

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

SESSION_COOKIE_SECURE = os.environ.get("DJANGO_COOKIE_SECURE", "true").lower() == "true"
CSRF_COOKIE_SECURE = SESSION_COOKIE_SECURE
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
# TLS termination is on Nginx; leave redirect off unless Django serves HTTPS directly.
SECURE_SSL_REDIRECT = os.environ.get("DJANGO_SECURE_SSL_REDIRECT", "false").lower() == "true"
if SECURE_SSL_REDIRECT:
    SECURE_HSTS_SECONDS = int(os.environ.get("DJANGO_HSTS_SECONDS", "31536000"))
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True

AWS_ACCESS_KEY_ID = os.environ.get("AWS_ACCESS_KEY_ID", "")
AWS_SECRET_ACCESS_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY", "")
AWS_REGION = os.environ.get("AWS_REGION") or os.environ.get("AWS_S3_REGION_NAME", "ap-south-1")
AWS_S3_BUCKET_NAME = os.environ.get("AWS_S3_BUCKET_NAME") or os.environ.get(
    "AWS_STORAGE_BUCKET_NAME", ""
)
_use_memory = os.environ.get("VENI_USE_MEMORY_STORAGE", "").lower() == "true"
if _use_memory:
    # Bootstrap / IP-only staging without S3 yet (uploads stay in-process).
    PRODUCT_IMAGE_STORAGE_BACKEND = "memory"
    PAYMENT_PROOF_STORAGE_BACKEND = "memory"
elif not AWS_S3_BUCKET_NAME:
    raise ValueError(
        "AWS_S3_BUCKET_NAME (or AWS_STORAGE_BUCKET_NAME) is required in production "
        "(or set VENI_USE_MEMORY_STORAGE=true for temporary bootstrap)"
    )
else:
    PRODUCT_IMAGE_STORAGE_BACKEND = "boto3"
    PAYMENT_PROOF_STORAGE_BACKEND = "boto3"

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": os.environ.get("DJANGO_LOG_LEVEL", "INFO"),
    },
    "loggers": {
        "django.request": {
            "handlers": ["console"],
            "level": os.environ.get("DJANGO_LOG_LEVEL", "INFO"),
            "propagate": False,
        },
    },
}
