from decimal import Decimal

import pytest

from apps.accounts.models import User, UserRole
from apps.cart.models import CartItem
from apps.orders.models import Order
from tests.helpers import CHECKOUT_CONTACT, csrf_headers as _csrf_headers


@pytest.fixture
def other_customer(db):
    return User.objects.create_user(
        email="buyer2@veni.test",
        password="buyer2-pass-123",
        role=UserRole.CUSTOMER,
    )


def _add_to_cart(client, variant_id, quantity, headers):
    return client.post(
        "/api/v1/cart/items/",
        {"variant_id": variant_id, "quantity": quantity},
        format="json",
        **headers,
    )


@pytest.mark.django_db
def test_anonymous_checkout_rejected(csrf_api_client):
    headers = _csrf_headers(csrf_api_client)
    resp = csrf_api_client.post("/api/v1/checkout/", CHECKOUT_CONTACT, format="json", **headers)
    assert resp.status_code in (401, 403)


@pytest.mark.django_db
def test_empty_cart_checkout_rejected(csrf_api_client, customer_user):
    csrf_api_client.force_login(customer_user)
    headers = _csrf_headers(csrf_api_client)
    resp = csrf_api_client.post("/api/v1/checkout/", CHECKOUT_CONTACT, format="json", **headers)
    assert resp.status_code == 400


@pytest.mark.django_db
def test_checkout_creates_order_and_clears_cart(
    csrf_api_client, customer_user, published_product
):
    client = csrf_api_client
    client.force_login(customer_user)
    headers = _csrf_headers(client)
    variant = published_product.variants.first()
    _add_to_cart(client, variant.id, 2, headers)
    resp = client.post("/api/v1/checkout/", CHECKOUT_CONTACT, format="json", **headers)
    assert resp.status_code == 201
    assert resp.data["status"] == "PENDING_PAYMENT"
    assert Decimal(resp.data["total"]) == Decimal("59.98")
    assert len(resp.data["items"]) == 1
    assert resp.data["items"][0]["product_name_snapshot"] == published_product.name
    assert CartItem.objects.count() == 0
    assert Order.objects.count() == 1
    variant.refresh_from_db()
    assert variant.inventory_count == 3


@pytest.mark.django_db
def test_checkout_uses_current_price_not_stale_cart_price(
    csrf_api_client, customer_user, published_product
):
    client = csrf_api_client
    client.force_login(customer_user)
    headers = _csrf_headers(client)
    variant = published_product.variants.first()
    _add_to_cart(client, variant.id, 1, headers)
    published_product.base_price = Decimal("120.00")
    published_product.save(update_fields=["base_price"])
    resp = client.post("/api/v1/checkout/", CHECKOUT_CONTACT, format="json", **headers)
    assert resp.status_code == 201
    assert Decimal(resp.data["items"][0]["unit_price"]) == Decimal("120.00")


@pytest.mark.django_db
def test_checkout_fails_insufficient_inventory(
    csrf_api_client, customer_user, published_product
):
    client = csrf_api_client
    client.force_login(customer_user)
    headers = _csrf_headers(client)
    variant = published_product.variants.first()
    _add_to_cart(client, variant.id, 5, headers)
    variant.inventory_count = 3
    variant.save(update_fields=["inventory_count"])
    resp = client.post("/api/v1/checkout/", CHECKOUT_CONTACT, format="json", **headers)
    assert resp.status_code == 400
    assert Order.objects.count() == 0
    variant.refresh_from_db()
    assert variant.inventory_count == 3
    assert CartItem.objects.count() == 1


@pytest.mark.django_db
def test_order_snapshot_unchanged_when_catalog_changes(
    csrf_api_client, customer_user, published_product
):
    client = csrf_api_client
    client.force_login(customer_user)
    headers = _csrf_headers(client)
    variant = published_product.variants.first()
    _add_to_cart(client, variant.id, 1, headers)
    checkout = client.post("/api/v1/checkout/", CHECKOUT_CONTACT, format="json", **headers)
    order_id = checkout.data["id"]
    published_product.name = "Renamed Product"
    published_product.base_price = Decimal("999.00")
    published_product.save()
    variant.sku = "new-sku"
    variant.label = "New Label"
    variant.save()
    detail = client.get(f"/api/v1/orders/{order_id}/")
    item = detail.data["items"][0]
    assert item["product_name_snapshot"] == "Test Serum"
    assert item["sku_snapshot"] == "test-serum-default"
    assert Decimal(item["unit_price"]) == Decimal("29.99")


@pytest.mark.django_db
def test_customer_cannot_view_other_order(
    csrf_api_client, customer_user, other_customer, published_product
):
    client = csrf_api_client
    client.force_login(customer_user)
    headers = _csrf_headers(client)
    variant = published_product.variants.first()
    _add_to_cart(client, variant.id, 1, headers)
    checkout = client.post("/api/v1/checkout/", CHECKOUT_CONTACT, format="json", **headers)
    order_id = checkout.data["id"]
    client.force_login(other_customer)
    resp = client.get(f"/api/v1/orders/{order_id}/")
    assert resp.status_code == 404


@pytest.mark.django_db
def test_admin_cannot_checkout(api_client, admin_user):
    api_client.force_login(admin_user)
    resp = api_client.post("/api/v1/checkout/", CHECKOUT_CONTACT, format="json")
    assert resp.status_code == 403


@pytest.mark.django_db
def test_order_list_for_customer(csrf_api_client, customer_user, published_product):
    client = csrf_api_client
    client.force_login(customer_user)
    headers = _csrf_headers(client)
    variant = published_product.variants.first()
    _add_to_cart(client, variant.id, 1, headers)
    client.post("/api/v1/checkout/", CHECKOUT_CONTACT, format="json", **headers)
    resp = client.get("/api/v1/orders/")
    assert resp.status_code == 200
    assert resp.data["count"] == 1


@pytest.mark.django_db
def test_sequential_checkout_consumes_last_unit(
    csrf_api_client, customer_user, other_customer, published_product
):
    variant = published_product.variants.first()
    variant.inventory_count = 1
    variant.save(update_fields=["inventory_count"])

    client1 = csrf_api_client
    client1.force_login(customer_user)
    h1 = _csrf_headers(client1)
    _add_to_cart(client1, variant.id, 1, h1)
    assert client1.post("/api/v1/checkout/", CHECKOUT_CONTACT, format="json", **h1).status_code == 201

    client2 = csrf_api_client
    client2.force_login(other_customer)
    h2 = _csrf_headers(client2)
    _add_to_cart(client2, variant.id, 1, h2)
    assert client2.post("/api/v1/checkout/", CHECKOUT_CONTACT, format="json", **h2).status_code == 400
    assert Order.objects.count() == 1
    variant.refresh_from_db()
    assert variant.inventory_count == 0


@pytest.mark.django_db
def test_guest_checkout_api_clears_session_cart(
    csrf_api_client, published_product
):
    headers = _csrf_headers(csrf_api_client)
    variant = published_product.variants.first()
    _add_to_cart(csrf_api_client, variant.id, 1, headers)
    resp = csrf_api_client.post(
        "/api/v1/checkout/guest/", CHECKOUT_CONTACT, format="json", **headers
    )
    assert resp.status_code == 201
    assert resp.data["access_token"]
    assert resp.data["contact_email"] == CHECKOUT_CONTACT["email"]
    assert resp.data["shipping_city"] == CHECKOUT_CONTACT["city"]
    cart = csrf_api_client.get("/api/v1/cart/", **headers)
    assert cart.status_code == 200
    assert cart.data["line_count"] == 0


@pytest.mark.django_db
def test_guest_order_by_token_rejects_wrong_token(
    csrf_api_client, published_product
):
    headers = _csrf_headers(csrf_api_client)
    variant = published_product.variants.first()
    _add_to_cart(csrf_api_client, variant.id, 1, headers)
    checkout = csrf_api_client.post(
        "/api/v1/checkout/guest/", CHECKOUT_CONTACT, format="json", **headers
    )
    assert checkout.status_code == 201
    token = checkout.data["access_token"]

    ok = csrf_api_client.get(f"/api/v1/orders/by-token/{token}/")
    assert ok.status_code == 200
    assert ok.data["id"] == checkout.data["id"]

    wrong = csrf_api_client.get(
        "/api/v1/orders/by-token/00000000-0000-0000-0000-000000000099/"
    )
    assert wrong.status_code == 404


@pytest.mark.django_db
def test_guest_order_by_token_cannot_access_other_order(
    csrf_api_client, published_product
):
    headers = _csrf_headers(csrf_api_client)
    variant = published_product.variants.first()
    _add_to_cart(csrf_api_client, variant.id, 1, headers)
    first = csrf_api_client.post(
        "/api/v1/checkout/guest/", CHECKOUT_CONTACT, format="json", **headers
    )
    assert first.status_code == 201

    headers2 = _csrf_headers(csrf_api_client)
    _add_to_cart(csrf_api_client, variant.id, 1, headers2)
    second = csrf_api_client.post(
        "/api/v1/checkout/guest/", CHECKOUT_CONTACT, format="json", **headers2
    )
    assert second.status_code == 201

    crossed = csrf_api_client.get(
        f"/api/v1/orders/by-token/{first.data['access_token']}/"
    )
    assert crossed.status_code == 200
    assert crossed.data["id"] == first.data["id"]
    assert crossed.data["id"] != second.data["id"]


@pytest.mark.django_db(transaction=True)
def test_concurrent_checkout_only_one_wins_last_unit(
    customer_user, other_customer, published_product
):
    """Two checkouts racing on the last unit: exactly one Order must succeed."""
    from concurrent.futures import ThreadPoolExecutor, as_completed

    from django.db import connection

    if connection.vendor == "sqlite":
        pytest.skip("True select_for_update races need PostgreSQL")

    from apps.cart.services.cart_service import add_item
    from apps.orders.services.checkout_service import ContactDetails, checkout_from_cart

    variant = published_product.variants.first()
    variant.inventory_count = 1
    variant.save(update_fields=["inventory_count"])

    contact = ContactDetails(**CHECKOUT_CONTACT)
    add_item(customer_user, variant_id=variant.id, quantity=1)
    add_item(other_customer, variant_id=variant.id, quantity=1)

    def race(user):
        try:
            order = checkout_from_cart(user, contact)
            return ("ok", order.id)
        except Exception as exc:  # noqa: BLE001 — loser raises ValidationError
            return ("err", type(exc).__name__)

    with ThreadPoolExecutor(max_workers=2) as pool:
        futures = [
            pool.submit(race, customer_user),
            pool.submit(race, other_customer),
        ]
        results = [f.result() for f in as_completed(futures)]

    oks = [r for r in results if r[0] == "ok"]
    errs = [r for r in results if r[0] == "err"]
    assert len(oks) == 1
    assert len(errs) == 1
    assert Order.objects.count() == 1
    variant.refresh_from_db()
    assert variant.inventory_count == 0
