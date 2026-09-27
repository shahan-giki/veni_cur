import pytest
from django.core.cache import cache
from rest_framework.test import APIClient
from rest_framework.throttling import ScopedRateThrottle

from apps.accounts.views import LoginView


@pytest.mark.enable_throttles
@pytest.mark.django_db
def test_login_throttle_rejects_burst(customer_user, monkeypatch):
    """DRF freezes THROTTLE_RATES at import — patch the class for a tight burst limit."""
    monkeypatch.setattr(
        ScopedRateThrottle,
        "THROTTLE_RATES",
        {"auth": "3/minute", "payment_upload": "20/minute"},
    )
    monkeypatch.setattr(LoginView, "throttle_classes", [ScopedRateThrottle])
    cache.clear()
    client = APIClient(enforce_csrf_checks=False)
    for _ in range(3):
        resp = client.post(
            "/api/v1/auth/login/",
            {"email": customer_user.email, "password": "wrong-password"},
            format="json",
        )
        assert resp.status_code in (400, 401, 403), resp.data
    blocked = client.post(
        "/api/v1/auth/login/",
        {"email": customer_user.email, "password": "wrong-password"},
        format="json",
    )
    assert blocked.status_code == 429
    cache.clear()
