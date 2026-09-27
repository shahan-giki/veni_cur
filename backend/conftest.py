import pytest
from rest_framework.test import APIClient

from apps.accounts.models import User, UserRole
from apps.catalog.models import Category, Product, ProductStatus


@pytest.fixture(autouse=True)
def _disable_throttles(monkeypatch, request):
    """Strip DRF view throttles for functional tests.

    ``APIView.throttle_classes`` is bound at import from settings, so clearing
    ``REST_FRAMEWORK['DEFAULT_THROTTLE_CLASSES']`` alone does not disable them.
    Opt out with ``@pytest.mark.enable_throttles``.
    """
    if request.node.get_closest_marker("enable_throttles"):
        yield
        return
    from rest_framework.views import APIView

    monkeypatch.setattr(APIView, "throttle_classes", [])
    yield


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def admin_user(db):
    return User.objects.create_user(
        email="admin@veni.test",
        password="admin-pass-123",
        role=UserRole.ADMIN,
    )


@pytest.fixture
def customer_user(db):
    return User.objects.create_user(
        email="customer@veni.test",
        password="customer-pass-123",
        role=UserRole.CUSTOMER,
    )


@pytest.fixture
def csrf_api_client():
    """API client with CSRF enforcement for session auth tests."""
    return APIClient(enforce_csrf_checks=True)


@pytest.fixture
def csrf_headers(csrf_api_client):
    from tests.helpers import csrf_headers as _csrf_headers

    return _csrf_headers(csrf_api_client)


@pytest.fixture
def category(db):
    return Category.objects.create(
        name="Skincare",
        slug="skincare",
        sort_order=1,
        is_active=True,
        is_visible=True,
    )


@pytest.fixture
def published_product(db, category):
    product = Product.objects.create(
        category=category,
        name="Test Serum",
        slug="test-serum",
        description="Hydrating serum",
        base_price="29.99",
        status=ProductStatus.PUBLISHED,
        is_active=True,
    )
    product.variants.create(
        sku="test-serum-default",
        label="Default",
        is_default=True,
        inventory_count=5,
        is_active=True,
    )
    return product
