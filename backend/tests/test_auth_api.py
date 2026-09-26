import pytest
from django.conf import settings
from django.contrib.auth import get_user_model

from apps.accounts.models import UserRole
from tests.helpers import csrf_headers as _csrf_headers

User = get_user_model()


@pytest.mark.django_db
def test_register_creates_customer(api_client, csrf_api_client):
    headers = _csrf_headers(csrf_api_client)
    resp = csrf_api_client.post(
        "/api/v1/auth/register/",
        {
            "email": "new@veni.test",
            "password": "StrongPass123!",
            "first_name": "New",
            "last_name": "User",
        },
        format="json",
        **headers,
    )
    assert resp.status_code == 201
    assert resp.data["email"] == "new@veni.test"
    assert resp.data["role"] == UserRole.CUSTOMER
    assert "password" not in resp.data
    user = User.objects.get(email="new@veni.test")
    assert user.check_password("StrongPass123!")
    assert user.role == UserRole.CUSTOMER


@pytest.mark.django_db
def test_register_rejects_duplicate_email(api_client, customer_user, csrf_api_client):
    headers = _csrf_headers(csrf_api_client)
    resp = csrf_api_client.post(
        "/api/v1/auth/register/",
        {
            "email": customer_user.email,
            "password": "StrongPass123!",
        },
        format="json",
        **headers,
    )
    assert resp.status_code == 400
    assert "email" in resp.data


@pytest.mark.django_db
def test_register_rejects_weak_password(csrf_api_client):
    headers = _csrf_headers(csrf_api_client)
    resp = csrf_api_client.post(
        "/api/v1/auth/register/",
        {"email": "weak@veni.test", "password": "123"},
        format="json",
        **headers,
    )
    assert resp.status_code == 400


@pytest.mark.django_db
def test_register_cannot_set_admin_role(csrf_api_client):
    headers = _csrf_headers(csrf_api_client)
    resp = csrf_api_client.post(
        "/api/v1/auth/register/",
        {
            "email": "hacker@veni.test",
            "password": "StrongPass123!",
            "role": UserRole.ADMIN,
        },
        format="json",
        **headers,
    )
    assert resp.status_code == 201
    assert resp.data["role"] == UserRole.CUSTOMER
    assert User.objects.get(email="hacker@veni.test").role == UserRole.CUSTOMER


@pytest.mark.django_db
def test_login_establishes_session(csrf_api_client, customer_user):
    headers = _csrf_headers(csrf_api_client)
    resp = csrf_api_client.post(
        "/api/v1/auth/login/",
        {"email": customer_user.email, "password": "customer-pass-123"},
        format="json",
        **headers,
    )
    assert resp.status_code == 200
    assert resp.data["email"] == customer_user.email
    assert "password" not in resp.data
    me = csrf_api_client.get("/api/v1/auth/me/")
    assert me.status_code == 200
    assert me.data["id"] == customer_user.id


@pytest.mark.django_db
def test_login_invalid_credentials_generic_error(csrf_api_client, customer_user):
    headers = _csrf_headers(csrf_api_client)
    resp = csrf_api_client.post(
        "/api/v1/auth/login/",
        {"email": customer_user.email, "password": "wrong-password"},
        format="json",
        **headers,
    )
    assert resp.status_code == 400
    assert resp.data["detail"] == "Invalid email or password."


@pytest.mark.django_db
def test_logout_terminates_session(csrf_api_client, customer_user):
    headers = _csrf_headers(csrf_api_client)
    csrf_api_client.post(
        "/api/v1/auth/login/",
        {"email": customer_user.email, "password": "customer-pass-123"},
        format="json",
        **headers,
    )
    logout_headers = _csrf_headers(csrf_api_client)
    logout = csrf_api_client.post("/api/v1/auth/logout/", **logout_headers)
    assert logout.status_code == 204
    me = csrf_api_client.get("/api/v1/auth/me/")
    assert me.status_code == 401


@pytest.mark.django_db
def test_me_unauthenticated(api_client):
    resp = api_client.get("/api/v1/auth/me/")
    assert resp.status_code == 401


@pytest.mark.django_db
def test_me_never_exposes_secrets(api_client, customer_user):
    api_client.force_login(customer_user)
    resp = api_client.get("/api/v1/auth/me/")
    assert resp.status_code == 200
    assert "password" not in resp.data
    assert "session_key" not in resp.data
    assert set(resp.data.keys()) >= {"id", "email", "first_name", "last_name", "role"}


@pytest.mark.django_db
def test_csrf_required_for_login(csrf_api_client, customer_user):
    resp = csrf_api_client.post(
        "/api/v1/auth/login/",
        {"email": customer_user.email, "password": "customer-pass-123"},
        format="json",
    )
    assert resp.status_code == 403


@pytest.mark.django_db
def test_csrf_cookie_endpoint_sets_token(csrf_api_client):
    resp = csrf_api_client.get("/api/v1/auth/csrf/")
    assert resp.status_code == 200
    assert "csrftoken" in csrf_api_client.cookies


@pytest.mark.django_db
def test_admin_role_preserved(api_client, admin_user):
    api_client.force_login(admin_user)
    resp = api_client.get("/api/v1/auth/me/")
    assert resp.data["role"] == UserRole.ADMIN


@pytest.mark.django_db
def test_session_cookie_settings():
    assert settings.SESSION_COOKIE_HTTPONLY is True
    assert settings.SESSION_COOKIE_SAMESITE == "Lax"
    assert settings.CSRF_COOKIE_HTTPONLY is False
