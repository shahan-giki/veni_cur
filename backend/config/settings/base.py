"""
Shared Django settings for Veni. Environment-specific modules import this file.
"""

import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = os.environ.get(
    "DJANGO_SECRET_KEY",
    "django-insecure-phase1-scaffold-only-change-before-production",
)

DEBUG = os.environ.get("DJANGO_DEBUG", "false").lower() == "true"

ALLOWED_HOSTS = [
    h.strip()
    for h in os.environ.get("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
    if h.strip()
]

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "corsheaders",
    "drf_spectacular",
    "apps.accounts",
    "apps.catalog",
    "apps.cart",
    "apps.orders",
    "apps.payments",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

AUTH_USER_MODEL = "accounts.User"

# --- Session auth (ADR-0001) — values finalized in production.py ---
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_HTTPONLY = False  # SPA must read CSRF cookie for double-submit header
CSRF_COOKIE_SAMESITE = "Lax"

CORS_ALLOW_CREDENTIALS = True
# Vite may be opened as localhost or 127.0.0.1 — Django CSRF treats them as distinct.
_DEFAULT_SPA_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173"
CORS_ALLOWED_ORIGINS = [
    o.strip()
    for o in os.environ.get("CORS_ALLOWED_ORIGINS", _DEFAULT_SPA_ORIGINS).split(",")
    if o.strip()
]
CSRF_TRUSTED_ORIGINS = [
    o.strip()
    for o in os.environ.get("CSRF_TRUSTED_ORIGINS", _DEFAULT_SPA_ORIGINS).split(",")
    if o.strip()
]

REST_FRAMEWORK = {
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.AllowAny",
    ],
    "DEFAULT_PAGINATION_CLASS": "common.pagination.VeniPageNumberPagination",
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.ScopedRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "auth": "30/minute",
        "payment_upload": "20/minute",
    },
}

# SMTP — when EMAIL_HOST is set, default to real delivery (not console).
EMAIL_HOST = os.environ.get("EMAIL_HOST", "").strip()
EMAIL_PORT = int(os.environ.get("EMAIL_PORT", "587"))
EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER", "").strip()
EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD", "")
EMAIL_USE_TLS = os.environ.get("EMAIL_USE_TLS", "true").lower() == "true"
EMAIL_USE_SSL = os.environ.get("EMAIL_USE_SSL", "false").lower() == "true"
DEFAULT_FROM_EMAIL = os.environ.get("DEFAULT_FROM_EMAIL", "noreply@veni.store")
_email_backend_default = (
    "django.core.mail.backends.smtp.EmailBackend"
    if EMAIL_HOST
    else "django.core.mail.backends.console.EmailBackend"
)
EMAIL_BACKEND = os.environ.get("EMAIL_BACKEND", _email_backend_default)
VENI_NOTIFICATIONS_CONSOLE = (
    os.environ.get(
        "VENI_NOTIFICATIONS_CONSOLE",
        "false" if EMAIL_HOST else "true",
    ).lower()
    == "true"
)

SPECTACULAR_SETTINGS = {
    "TITLE": "Veni API",
    "DESCRIPTION": "Veni B2C e-commerce API — catalog, session auth, customer cart.",
    "VERSION": "0.9.0",
}

# --- S3 placeholders (ADR-0005) — used from Phase 3+ ---
AWS_REGION = os.environ.get("AWS_REGION", "ap-south-1")
AWS_S3_BUCKET_NAME = os.environ.get("AWS_S3_BUCKET_NAME", "")

PRODUCT_IMAGE_MAX_BYTES = int(
    os.environ.get("PRODUCT_IMAGE_MAX_BYTES", str(5 * 1024 * 1024))
)
PRODUCT_IMAGE_STORAGE_BACKEND = os.environ.get("PRODUCT_IMAGE_STORAGE_BACKEND", "boto3")
PAYMENT_PROOF_STORAGE_BACKEND = os.environ.get(
    "PAYMENT_PROOF_STORAGE_BACKEND", "memory"
)
PAYMENT_PROOF_MAX_BYTES = int(
    os.environ.get("PAYMENT_PROOF_MAX_BYTES", str(5 * 1024 * 1024))
)
VENI_PAYMENT_BANK_NAME = os.environ.get("VENI_PAYMENT_BANK_NAME", "Meezan Digital Centre")
VENI_PAYMENT_ACCOUNT_TITLE = os.environ.get("VENI_PAYMENT_ACCOUNT_TITLE", "SHAHAN ALI")
VENI_PAYMENT_ACCOUNT_NUMBER = os.environ.get(
    "VENI_PAYMENT_ACCOUNT_NUMBER", "00300112202336"
)
VENI_PAYMENT_IBAN = os.environ.get(
    "VENI_PAYMENT_IBAN", "PK27MEZN0000300112202336"
)
VENI_MANUAL_PAYMENT_INSTRUCTIONS = os.environ.get(
    "VENI_MANUAL_PAYMENT_INSTRUCTIONS",
    (
        "Transfer the exact order total to the Meezan account above via bank transfer "
        "or mobile wallet. Use your order number as the payment reference, then upload "
        "a screenshot of the confirmation on this page."
    ),
)
S3_PRESIGN_UPLOAD_EXPIRY = int(os.environ.get("S3_PRESIGN_UPLOAD_EXPIRY", "3600"))
S3_PRESIGN_READ_EXPIRY = int(os.environ.get("S3_PRESIGN_READ_EXPIRY", "900"))
