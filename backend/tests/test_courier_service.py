from decimal import Decimal

import pytest

from apps.cart.services import cart_service
from apps.orders.models import PaymentMethod
from apps.orders.services.checkout_service import ContactDetails, checkout_from_cart
from apps.orders.services.courier_service import build_courier_slip, update_courier_details

CONTACT = ContactDetails(
    name="Ayesha Khan",
    phone="+92 300 1234567",
    email="ayesha@example.test",
    address="12 Jinnah Road",
    city="Lahore",
)


@pytest.mark.django_db
def test_courier_slip_for_cod_includes_collectable_amount(customer_user, published_product):
    variant = published_product.variants.first()
    cart_service.add_item(customer_user, variant_id=variant.id, quantity=2)
    order = checkout_from_cart(
        customer_user, CONTACT, payment_method=PaymentMethod.CASH_ON_DELIVERY
    )

    slip = build_courier_slip(order)

    assert slip["order_number"].startswith("VENI-")
    assert slip["consignee_name"] == "Ayesha Khan"
    assert slip["consignee_phone"] == "+92 300 1234567"
    assert slip["consignee_address"] == "12 Jinnah Road"
    assert slip["consignee_city"] == "Lahore"
    assert slip["pieces"] == 2
    assert slip["payment_mode"] == "COD"
    assert slip["cod_amount"] == order.total
    assert "Serum" in slip["product_description"] or "Test" in slip["product_description"]


@pytest.mark.django_db
def test_courier_slip_for_prepaid_has_zero_cod(customer_user, published_product):
    variant = published_product.variants.first()
    cart_service.add_item(customer_user, variant_id=variant.id, quantity=1)
    order = checkout_from_cart(customer_user, CONTACT)

    slip = build_courier_slip(order)

    assert slip["payment_mode"] == "Prepaid"
    assert slip["cod_amount"] == Decimal("0.00")


@pytest.mark.django_db
def test_update_courier_details_persists_tracking(customer_user, published_product):
    variant = published_product.variants.first()
    cart_service.add_item(customer_user, variant_id=variant.id, quantity=1)
    order = checkout_from_cart(
        customer_user, CONTACT, payment_method=PaymentMethod.CASH_ON_DELIVERY
    )

    updated = update_courier_details(
        order_id=order.id,
        courier_name="TCS",
        tracking_number="TCS-123456",
        notes="Leave at gate",
    )

    assert updated.courier_name == "TCS"
    assert updated.courier_tracking_number == "TCS-123456"
    assert updated.courier_notes == "Leave at gate"
