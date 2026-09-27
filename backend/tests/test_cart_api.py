from decimal import Decimal

import pytest
from django.db import IntegrityError

from apps.accounts.models import User, UserRole
from apps.cart.models import Cart, CartItem
from tests.helpers import csrf_headers as _csrf_headers


@pytest.fixture
def other_customer(db):
    return User.objects.create_user(
        email="other@veni.test",
        password="other-pass-123",
        role=UserRole.CUSTOMER,
    )


@pytest.mark.django_db
def test_anonymous_can_get_empty_cart(api_client):
    resp = api_client.get("/api/v1/cart/")
    assert resp.status_code == 200
    assert resp.data["items"] == []
    assert resp.data["item_count"] == 0


@pytest.mark.django_db
def test_anonymous_can_add_to_cart(csrf_api_client, published_product):
    headers = _csrf_headers(csrf_api_client)
    variant = published_product.variants.first()
    resp = csrf_api_client.post(
        "/api/v1/cart/items/",
        {"variant_id": variant.id, "quantity": 1},
        format="json",
        **headers,
    )
    assert resp.status_code == 200
    assert resp.data["item_count"] == 1
    assert Cart.objects.filter(user__isnull=True).count() == 1


@pytest.mark.django_db
def test_add_to_cart_accepts_vite_127_origin(csrf_api_client, published_product, settings):
    """SPA on 127.0.0.1:5173 must pass CSRF Origin checks (not only localhost)."""
    settings.CSRF_TRUSTED_ORIGINS = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    headers = {
        **_csrf_headers(csrf_api_client),
        "HTTP_ORIGIN": "http://127.0.0.1:5173",
        "HTTP_REFERER": "http://127.0.0.1:5173/products/test",
    }
    variant = published_product.variants.first()
    resp = csrf_api_client.post(
        "/api/v1/cart/items/",
        {"variant_id": variant.id, "quantity": 1},
        format="json",
        **headers,
    )
    assert resp.status_code == 200, resp.data
    assert resp.data["item_count"] == 1


@pytest.mark.django_db
def test_guest_cart_merges_on_login(
    csrf_api_client, customer_user, published_product
):
    headers = _csrf_headers(csrf_api_client)
    variant = published_product.variants.first()
    csrf_api_client.post(
        "/api/v1/cart/items/",
        {"variant_id": variant.id, "quantity": 2},
        format="json",
        **headers,
    )
    login = csrf_api_client.post(
        "/api/v1/auth/login/",
        {"email": customer_user.email, "password": "customer-pass-123"},
        format="json",
        **headers,
    )
    assert login.status_code == 200
    cart = csrf_api_client.get("/api/v1/cart/")
    assert cart.status_code == 200
    assert cart.data["item_count"] == 2
    assert Cart.objects.filter(user=customer_user).count() == 1
    assert Cart.objects.filter(user__isnull=True).count() == 0


@pytest.mark.django_db
def test_admin_cannot_access_customer_cart(api_client, admin_user):
    api_client.force_login(admin_user)
    resp = api_client.get("/api/v1/cart/")
    assert resp.status_code == 403


@pytest.mark.django_db
def test_cart_created_and_reused(api_client, customer_user, published_product):
    api_client.force_login(customer_user)
    r1 = api_client.get("/api/v1/cart/")
    r2 = api_client.get("/api/v1/cart/")
    assert r1.status_code == 200
    assert r2.status_code == 200
    assert r1.data["id"] == r2.data["id"]
    assert Cart.objects.filter(user=customer_user).count() == 1


@pytest.mark.django_db
def test_add_item_and_totals(
    csrf_api_client, customer_user, published_product
):
    api_client = csrf_api_client
    api_client.force_login(customer_user)
    headers = _csrf_headers(api_client)
    variant = published_product.variants.first()
    resp = api_client.post(
        "/api/v1/cart/items/",
        {"variant_id": variant.id, "quantity": 2},
        format="json",
        **headers,
    )
    assert resp.status_code == 200
    assert resp.data["item_count"] == 2
    assert resp.data["line_count"] == 1
    assert Decimal(resp.data["subtotal"]) == Decimal("29.99") * 2
    item = resp.data["items"][0]
    assert item["unit_price"] == "29.99"
    assert item["line_total"] == "59.98"


@pytest.mark.django_db
def test_add_same_variant_merges_quantity(
    csrf_api_client, customer_user, published_product
):
    api_client = csrf_api_client
    api_client.force_login(customer_user)
    headers = _csrf_headers(api_client)
    variant = published_product.variants.first()
    api_client.post(
        "/api/v1/cart/items/",
        {"variant_id": variant.id, "quantity": 1},
        format="json",
        **headers,
    )
    resp = api_client.post(
        "/api/v1/cart/items/",
        {"variant_id": variant.id, "quantity": 2},
        format="json",
        **headers,
    )
    assert resp.status_code == 200
    assert resp.data["item_count"] == 3
    assert CartItem.objects.count() == 1


@pytest.mark.django_db
def test_update_quantity(csrf_api_client, customer_user, published_product):
    api_client = csrf_api_client
    api_client.force_login(customer_user)
    headers = _csrf_headers(api_client)
    variant = published_product.variants.first()
    add = api_client.post(
        "/api/v1/cart/items/",
        {"variant_id": variant.id, "quantity": 1},
        format="json",
        **headers,
    )
    item_id = add.data["items"][0]["id"]
    resp = api_client.patch(
        f"/api/v1/cart/items/{item_id}/",
        {"quantity": 3},
        format="json",
        **headers,
    )
    assert resp.status_code == 200
    assert resp.data["item_count"] == 3


@pytest.mark.django_db
def test_remove_item(csrf_api_client, customer_user, published_product):
    api_client = csrf_api_client
    api_client.force_login(customer_user)
    headers = _csrf_headers(api_client)
    variant = published_product.variants.first()
    add = api_client.post(
        "/api/v1/cart/items/",
        {"variant_id": variant.id, "quantity": 1},
        format="json",
        **headers,
    )
    item_id = add.data["items"][0]["id"]
    resp = api_client.delete(f"/api/v1/cart/items/{item_id}/", **headers)
    assert resp.status_code == 200
    assert resp.data["item_count"] == 0


@pytest.mark.django_db
def test_clear_cart(csrf_api_client, customer_user, published_product):
    api_client = csrf_api_client
    api_client.force_login(customer_user)
    headers = _csrf_headers(api_client)
    variant = published_product.variants.first()
    api_client.post(
        "/api/v1/cart/items/",
        {"variant_id": variant.id, "quantity": 1},
        format="json",
        **headers,
    )
    resp = api_client.delete("/api/v1/cart/", **headers)
    assert resp.status_code == 200
    assert resp.data["items"] == []


@pytest.mark.django_db
def test_quantity_exceeds_inventory(
    csrf_api_client, customer_user, published_product
):
    api_client = csrf_api_client
    api_client.force_login(customer_user)
    headers = _csrf_headers(api_client)
    variant = published_product.variants.first()
    resp = api_client.post(
        "/api/v1/cart/items/",
        {"variant_id": variant.id, "quantity": 999},
        format="json",
        **headers,
    )
    assert resp.status_code == 400


@pytest.mark.django_db
def test_draft_product_variant_rejected(
    csrf_api_client, customer_user, category
):
    from apps.catalog.models import Product, ProductStatus

    api_client = csrf_api_client
    api_client.force_login(customer_user)
    headers = _csrf_headers(api_client)
    product = Product.objects.create(
        category=category,
        name="Draft",
        slug="draft-cart",
        base_price="10.00",
        status=ProductStatus.DRAFT,
        is_active=True,
    )
    variant = product.variants.create(
        sku="draft-cart-default",
        label="Default",
        is_default=True,
        inventory_count=5,
        is_active=True,
    )
    resp = api_client.post(
        "/api/v1/cart/items/",
        {"variant_id": variant.id, "quantity": 1},
        format="json",
        **headers,
    )
    assert resp.status_code == 400


@pytest.mark.django_db
def test_cannot_modify_other_customers_cart_item(
    csrf_api_client, customer_user, other_customer, published_product
):
    api_client = csrf_api_client
    api_client.force_login(customer_user)
    headers = _csrf_headers(api_client)
    variant = published_product.variants.first()
    add = api_client.post(
        "/api/v1/cart/items/",
        {"variant_id": variant.id, "quantity": 1},
        format="json",
        **headers,
    )
    item_id = add.data["items"][0]["id"]

    api_client.force_login(other_customer)
    headers_other = _csrf_headers(api_client)
    resp = api_client.patch(
        f"/api/v1/cart/items/{item_id}/",
        {"quantity": 2},
        format="json",
        **headers_other,
    )
    assert resp.status_code == 400


@pytest.mark.django_db
def test_one_cart_per_customer(db, customer_user, other_customer):
    Cart.objects.create(user=customer_user)
    Cart.objects.create(user=other_customer)
    assert Cart.objects.count() == 2
    with pytest.raises(IntegrityError):
        Cart.objects.create(user=customer_user)
