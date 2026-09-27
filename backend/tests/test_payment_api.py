import pytest

from apps.accounts.models import User, UserRole
from apps.orders.models import OrderStatus
from apps.payments.models import Payment, PaymentStatus
from tests.helpers import CHECKOUT_CONTACT, csrf_headers as _csrf_headers


@pytest.fixture
def other_customer(db):
    return User.objects.create_user(
        email="other-pay@veni.test",
        password="other-pass-123",
        role=UserRole.CUSTOMER,
    )


def _checkout(client, customer_user, published_product, headers):
    client.force_login(customer_user)
    variant = published_product.variants.first()
    client.post(
        "/api/v1/cart/items/",
        {"variant_id": variant.id, "quantity": 1},
        format="json",
        **headers,
    )
    return client.post("/api/v1/checkout/", CHECKOUT_CONTACT, format="json", **headers)


def _presign(client, order_id, headers, **extra):
    payload = {
        "order_id": order_id,
        "file_type": "image/png",
        "file_name": "receipt.png",
        "byte_size": 1024,
        **extra,
    }
    return client.post("/api/v1/payments/presign/", payload, format="json", **headers)


def _confirm(client, order_id, s3_key, headers, reference_number=""):
    return client.post(
        "/api/v1/payments/confirm/",
        {
            "order_id": order_id,
            "s3_key": s3_key,
            "reference_number": reference_number,
        },
        format="json",
        **headers,
    )


@pytest.mark.django_db
def test_checkout_does_not_create_payment_record(
    csrf_api_client, customer_user, published_product
):
    headers = _csrf_headers(csrf_api_client)
    resp = _checkout(csrf_api_client, customer_user, published_product, headers)
    assert resp.status_code == 201
    assert resp.data["status"] == OrderStatus.PENDING_PAYMENT
    assert resp.data["payment"]["can_upload_proof"] is True
    assert Payment.objects.count() == 0


@pytest.mark.django_db
def test_payment_instructions(csrf_api_client, customer_user):
    csrf_api_client.force_login(customer_user)
    resp = csrf_api_client.get("/api/v1/payments/instructions/")
    assert resp.status_code == 200
    assert resp.data["currency"] == "PKR"
    assert resp.data["bank_name"]
    assert resp.data["iban"]


@pytest.mark.django_db
def test_presign_and_confirm_proof(
    csrf_api_client, customer_user, published_product, settings
):
    settings.PAYMENT_PROOF_STORAGE_BACKEND = "memory"
    headers = _csrf_headers(csrf_api_client)
    checkout = _checkout(csrf_api_client, customer_user, published_product, headers)
    order_id = checkout.data["id"]
    presign = _presign(csrf_api_client, order_id, headers)
    assert presign.status_code == 200
    s3_key = presign.data["s3_key"]
    confirm = _confirm(
        csrf_api_client, order_id, s3_key, headers, reference_number="TXN-99"
    )
    assert confirm.status_code == 200
    assert confirm.data["status"] == PaymentStatus.PENDING
    assert confirm.data["reference_number"] == "TXN-99"
    payment = Payment.objects.get(pk=confirm.data["id"])
    assert payment.proof_s3_key == s3_key
    payment.order.refresh_from_db()
    assert payment.order.status == OrderStatus.PAYMENT_VERIFICATION


@pytest.mark.django_db
def test_rejected_payment_allows_reupload(
    csrf_api_client, customer_user, published_product, settings, admin_user
):
    settings.PAYMENT_PROOF_STORAGE_BACKEND = "memory"
    headers = _csrf_headers(csrf_api_client)
    checkout = _checkout(csrf_api_client, customer_user, published_product, headers)
    order_id = checkout.data["id"]
    presign = _presign(csrf_api_client, order_id, headers)
    confirm = _confirm(csrf_api_client, order_id, presign.data["s3_key"], headers)
    payment_id = confirm.data["id"]
    csrf_api_client.force_login(admin_user)
    admin_headers = _csrf_headers(csrf_api_client)
    reject = csrf_api_client.post(
        f"/api/v1/admin/payments/{payment_id}/reject/",
        {"reason": "Screenshot is blurry"},
        format="json",
        **admin_headers,
    )
    assert reject.status_code == 200
    csrf_api_client.force_login(customer_user)
    headers = _csrf_headers(csrf_api_client)
    presign2 = _presign(csrf_api_client, order_id, headers)
    assert presign2.status_code == 200
    confirm2 = _confirm(csrf_api_client, order_id, presign2.data["s3_key"], headers)
    assert confirm2.status_code == 200
    assert Payment.objects.filter(order_id=order_id).count() == 2


@pytest.mark.django_db
def test_cannot_upload_while_pending_review(
    csrf_api_client, customer_user, published_product, settings
):
    settings.PAYMENT_PROOF_STORAGE_BACKEND = "memory"
    headers = _csrf_headers(csrf_api_client)
    checkout = _checkout(csrf_api_client, customer_user, published_product, headers)
    order_id = checkout.data["id"]
    presign = _presign(csrf_api_client, order_id, headers)
    _confirm(csrf_api_client, order_id, presign.data["s3_key"], headers)
    retry = _presign(csrf_api_client, order_id, headers)
    assert retry.status_code == 400


@pytest.mark.django_db
def test_other_customer_cannot_presign(
    csrf_api_client, customer_user, other_customer, published_product, settings
):
    settings.PAYMENT_PROOF_STORAGE_BACKEND = "memory"
    headers = _csrf_headers(csrf_api_client)
    checkout = _checkout(csrf_api_client, customer_user, published_product, headers)
    order_id = checkout.data["id"]
    csrf_api_client.force_login(other_customer)
    headers2 = _csrf_headers(csrf_api_client)
    resp = _presign(csrf_api_client, order_id, headers2)
    assert resp.status_code == 404


@pytest.mark.django_db
def test_admin_verify_updates_order(
    csrf_api_client, customer_user, published_product, settings, admin_user
):
    settings.PAYMENT_PROOF_STORAGE_BACKEND = "memory"
    headers = _csrf_headers(csrf_api_client)
    checkout = _checkout(csrf_api_client, customer_user, published_product, headers)
    order_id = checkout.data["id"]
    presign = _presign(csrf_api_client, order_id, headers)
    confirm = _confirm(csrf_api_client, order_id, presign.data["s3_key"], headers)
    payment_id = confirm.data["id"]
    csrf_api_client.force_login(admin_user)
    admin_headers = _csrf_headers(csrf_api_client)
    verify = csrf_api_client.post(
        f"/api/v1/admin/payments/{payment_id}/verify/",
        format="json",
        **admin_headers,
    )
    assert verify.status_code == 200
    assert verify.data["status"] == PaymentStatus.VERIFIED
    from apps.orders.models import Order

    assert Order.objects.get(pk=order_id).status == OrderStatus.PROCESSING


@pytest.mark.django_db
def test_customer_cannot_admin_verify(
    csrf_api_client, customer_user, published_product, settings
):
    settings.PAYMENT_PROOF_STORAGE_BACKEND = "memory"
    headers = _csrf_headers(csrf_api_client)
    checkout = _checkout(csrf_api_client, customer_user, published_product, headers)
    order_id = checkout.data["id"]
    presign = _presign(csrf_api_client, order_id, headers)
    confirm = _confirm(csrf_api_client, order_id, presign.data["s3_key"], headers)
    payment_id = confirm.data["id"]
    resp = csrf_api_client.post(
        f"/api/v1/admin/payments/{payment_id}/verify/",
        format="json",
        **headers,
    )
    assert resp.status_code == 403


@pytest.mark.django_db
def test_admin_proof_presigned_read(
    csrf_api_client, customer_user, published_product, settings, admin_user
):
    settings.PAYMENT_PROOF_STORAGE_BACKEND = "memory"
    headers = _csrf_headers(csrf_api_client)
    checkout = _checkout(csrf_api_client, customer_user, published_product, headers)
    order_id = checkout.data["id"]
    presign = _presign(csrf_api_client, order_id, headers)
    confirm = _confirm(csrf_api_client, order_id, presign.data["s3_key"], headers)
    csrf_api_client.force_login(admin_user)
    admin_headers = _csrf_headers(csrf_api_client)
    proof = csrf_api_client.get(
        f"/api/v1/admin/payments/{confirm.data['id']}/proof/",
        **admin_headers,
    )
    assert proof.status_code == 200
    assert "fake-s3.test" in proof.data["url"]


@pytest.mark.django_db
def test_guest_can_presign_with_access_token(
    csrf_api_client, published_product, settings
):
    settings.PAYMENT_PROOF_STORAGE_BACKEND = "memory"
    headers = _csrf_headers(csrf_api_client)
    variant = published_product.variants.first()
    csrf_api_client.post(
        "/api/v1/cart/items/",
        {"variant_id": variant.id, "quantity": 1},
        format="json",
        **headers,
    )
    checkout = csrf_api_client.post(
        "/api/v1/checkout/guest/", CHECKOUT_CONTACT, format="json", **headers
    )
    assert checkout.status_code == 201
    order_id = checkout.data["id"]
    token = checkout.data["access_token"]
    # New anonymous client (no login)
    headers2 = _csrf_headers(csrf_api_client)
    csrf_api_client.logout()
    headers2 = _csrf_headers(csrf_api_client)
    presign = _presign(
        csrf_api_client, order_id, headers2, access_token=token
    )
    assert presign.status_code == 200
    confirm = csrf_api_client.post(
        "/api/v1/payments/confirm/",
        {
            "order_id": order_id,
            "s3_key": presign.data["s3_key"],
            "access_token": token,
        },
        format="json",
        **headers2,
    )
    assert confirm.status_code == 200


@pytest.mark.django_db
def test_guest_cannot_presign_with_wrong_token(
    csrf_api_client, published_product, settings
):
    settings.PAYMENT_PROOF_STORAGE_BACKEND = "memory"
    headers = _csrf_headers(csrf_api_client)
    variant = published_product.variants.first()
    csrf_api_client.post(
        "/api/v1/cart/items/",
        {"variant_id": variant.id, "quantity": 1},
        format="json",
        **headers,
    )
    checkout = csrf_api_client.post(
        "/api/v1/checkout/guest/", CHECKOUT_CONTACT, format="json", **headers
    )
    order_id = checkout.data["id"]
    csrf_api_client.logout()
    headers2 = _csrf_headers(csrf_api_client)
    bad = _presign(
        csrf_api_client,
        order_id,
        headers2,
        access_token="00000000-0000-0000-0000-000000000099",
    )
    assert bad.status_code == 404


@pytest.mark.django_db
def test_anonymous_instructions_allowed(csrf_api_client):
    resp = csrf_api_client.get("/api/v1/payments/instructions/")
    assert resp.status_code == 200
    assert resp.data["currency"] == "PKR"
