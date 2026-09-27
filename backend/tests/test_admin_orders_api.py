import pytest

from apps.orders.models import OrderStatus
from tests.helpers import csrf_headers as _csrf_headers
from tests.test_payment_api import _checkout, _confirm, _presign


@pytest.mark.django_db
def test_admin_order_list_requires_admin(
    csrf_api_client, customer_user, admin_user, published_product
):
    headers = _csrf_headers(csrf_api_client)
    _checkout(csrf_api_client, customer_user, published_product, headers)
    csrf_api_client.force_login(customer_user)
    resp = csrf_api_client.get("/api/v1/admin/orders/", **headers)
    assert resp.status_code == 403


@pytest.mark.django_db
def test_admin_order_list_and_filter(
    csrf_api_client, customer_user, admin_user, published_product, settings
):
    settings.PAYMENT_PROOF_STORAGE_BACKEND = "memory"
    headers = _csrf_headers(csrf_api_client)
    checkout = _checkout(csrf_api_client, customer_user, published_product, headers)
    order_id = checkout.data["id"]
    presign = _presign(csrf_api_client, order_id, headers)
    _confirm(csrf_api_client, order_id, presign.data["s3_key"], headers)
    csrf_api_client.force_login(admin_user)
    admin_headers = _csrf_headers(csrf_api_client)
    all_orders = csrf_api_client.get("/api/v1/admin/orders/", **admin_headers)
    assert all_orders.status_code == 200
    assert all_orders.data["count"] >= 1
    filtered = csrf_api_client.get(
        "/api/v1/admin/orders/",
        {"status": OrderStatus.PAYMENT_VERIFICATION},
        **admin_headers,
    )
    assert filtered.status_code == 200
    assert any(row["id"] == order_id for row in filtered.data["results"])


@pytest.mark.django_db
def test_admin_order_detail_includes_payments(
    csrf_api_client, customer_user, admin_user, published_product, settings
):
    settings.PAYMENT_PROOF_STORAGE_BACKEND = "memory"
    headers = _csrf_headers(csrf_api_client)
    checkout = _checkout(csrf_api_client, customer_user, published_product, headers)
    order_id = checkout.data["id"]
    presign = _presign(csrf_api_client, order_id, headers)
    confirm = _confirm(csrf_api_client, order_id, presign.data["s3_key"], headers)
    csrf_api_client.force_login(admin_user)
    admin_headers = _csrf_headers(csrf_api_client)
    resp = csrf_api_client.get(f"/api/v1/admin/orders/{order_id}/", **admin_headers)
    assert resp.status_code == 200
    assert resp.data["customer"]["email"] == customer_user.email
    assert len(resp.data["payments"]) == 1
    assert resp.data["payments"][0]["id"] == confirm.data["id"]


@pytest.mark.django_db
def test_admin_mark_shipped_from_processing(
    csrf_api_client, customer_user, admin_user, published_product, settings
):
    settings.PAYMENT_PROOF_STORAGE_BACKEND = "memory"
    headers = _csrf_headers(csrf_api_client)
    checkout = _checkout(csrf_api_client, customer_user, published_product, headers)
    order_id = checkout.data["id"]
    presign = _presign(csrf_api_client, order_id, headers)
    confirm = _confirm(csrf_api_client, order_id, presign.data["s3_key"], headers)
    csrf_api_client.force_login(admin_user)
    admin_headers = _csrf_headers(csrf_api_client)
    csrf_api_client.post(
        f"/api/v1/admin/payments/{confirm.data['id']}/verify/",
        format="json",
        **admin_headers,
    )
    ship = csrf_api_client.patch(
        f"/api/v1/admin/orders/{order_id}/status/",
        {"status": OrderStatus.SHIPPED},
        format="json",
        **admin_headers,
    )
    assert ship.status_code == 200
    assert ship.data["status"] == OrderStatus.SHIPPED


@pytest.mark.django_db
def test_admin_cannot_ship_without_processing(
    csrf_api_client, customer_user, admin_user, published_product
):
    headers = _csrf_headers(csrf_api_client)
    checkout = _checkout(csrf_api_client, customer_user, published_product, headers)
    order_id = checkout.data["id"]
    csrf_api_client.force_login(admin_user)
    admin_headers = _csrf_headers(csrf_api_client)
    resp = csrf_api_client.patch(
        f"/api/v1/admin/orders/{order_id}/status/",
        {"status": OrderStatus.SHIPPED},
        format="json",
        **admin_headers,
    )
    assert resp.status_code == 400


@pytest.mark.django_db
def test_admin_cancel_restocks_inventory(
    csrf_api_client, customer_user, admin_user, published_product
):
    variant = published_product.variants.get()
    start_inventory = variant.inventory_count
    headers = _csrf_headers(csrf_api_client)
    checkout = _checkout(csrf_api_client, customer_user, published_product, headers)
    order_id = checkout.data["id"]
    variant.refresh_from_db()
    assert variant.inventory_count == start_inventory - 1

    csrf_api_client.force_login(admin_user)
    admin_headers = _csrf_headers(csrf_api_client)
    cancel = csrf_api_client.patch(
        f"/api/v1/admin/orders/{order_id}/status/",
        {"status": OrderStatus.CANCELLED},
        format="json",
        **admin_headers,
    )
    assert cancel.status_code == 200
    assert cancel.data["status"] == OrderStatus.CANCELLED
    variant.refresh_from_db()
    assert variant.inventory_count == start_inventory
