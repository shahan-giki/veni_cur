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
CORS_ALLOWED_ORIGINS = [
    o.strip()
    for o in os.environ.get("CORS_ALLOWED_ORIGINS", "http://localhost:5173").split(",")
    if o.strip()
]
CSRF_TRUSTED_ORIGINS = [
    o.strip()
    for o in os.environ.get("CSRF_TRUSTED_ORIGINS", "http://localhost:5173").split(",")
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
}

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
VENI_PAYMENT_BANK_NAME = os.environ.get("VENI_PAYMENT_BANK_NAME", "Habib Bank Limited")
VENI_PAYMENT_ACCOUNT_TITLE = os.environ.get("VENI_PAYMENT_ACCOUNT_TITLE", "Veni (Pvt) Ltd")
VENI_PAYMENT_ACCOUNT_NUMBER = os.environ.get(
    "VENI_PAYMENT_ACCOUNT_NUMBER", "01234567890123"
)
VENI_PAYMENT_IBAN = os.environ.get(
    "VENI_PAYMENT_IBAN", "PK00HABB0000123456789012"
)
VENI_MANUAL_PAYMENT_INSTRUCTIONS = os.environ.get(
    "VENI_MANUAL_PAYMENT_INSTRUCTIONS",
    (
        "Transfer the exact order total to Veni via bank transfer or mobile wallet. "
        "Use your order number as the payment reference, then upload a screenshot "
        "of the confirmation on this page."
    ),
)
S3_PRESIGN_UPLOAD_EXPIRY = int(os.environ.get("S3_PRESIGN_UPLOAD_EXPIRY", "3600"))
S3_PRESIGN_READ_EXPIRY = int(os.environ.get("S3_PRESIGN_READ_EXPIRY", "900"))
