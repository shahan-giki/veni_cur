import pytest
from django.core.exceptions import ValidationError

from apps.cart.services import cart_service
from apps.orders.services.checkout_service import (
    ContactDetails,
    OrderLine,
    checkout_as_guest,
    checkout_from_cart,
    checkout_from_session_cart,
)

CONTACT = ContactDetails(
    name="Ayesha Khan",
    phone="+92 300 1234567",
    email="ayesha@example.test",
    address="12 Jinnah Road",
    city="Lahore",
)


@pytest.fixture
def variant(published_product):
    v = published_product.variants.first()
    v.inventory_count = 5
    v.save(update_fields=["inventory_count"])
    return v


@pytest.mark.django_db
def test_signed_in_checkout_freezes_contact_details(customer_user, variant):
    cart_service.add_item(customer_user, variant_id=variant.id, quantity=2)

    order = checkout_from_cart(customer_user, CONTACT)

    assert order.customer == customer_user
    assert order.contact_name == "Ayesha Khan"
    assert order.contact_phone == "+92 300 1234567"
    assert order.contact_email == "ayesha@example.test"
    assert order.shipping_address == "12 Jinnah Road"
    assert order.shipping_city == "Lahore"


@pytest.mark.django_db
def test_guest_checkout_creates_order_without_a_customer(variant):
    order = checkout_as_guest([OrderLine(variant_id=variant.id, quantity=2)], CONTACT)

    assert order.customer_id is None
    assert order.contact_email == "ayesha@example.test"
    assert order.access_token is not None


@pytest.mark.django_db
def test_guest_orders_get_distinct_access_tokens(variant):
    first = checkout_as_guest([OrderLine(variant_id=variant.id, quantity=1)], CONTACT)
    second = checkout_as_guest([OrderLine(variant_id=variant.id, quantity=1)], CONTACT)

    assert first.access_token != second.access_token


@pytest.mark.django_db
def test_guest_checkout_snapshots_prices_and_decrements_inventory(variant):
    order = checkout_as_guest([OrderLine(variant_id=variant.id, quantity=2)], CONTACT)

    variant.refresh_from_db()
    item = order.items.get()
    assert variant.inventory_count == 3
    assert item.quantity == 2
    assert item.unit_price == variant.product.base_price
    assert order.total == variant.product.base_price * 2


@pytest.mark.django_db
def test_guest_checkout_rejects_empty_lines():
    with pytest.raises(ValidationError):
        checkout_as_guest([], CONTACT)


@pytest.mark.django_db
def test_guest_checkout_rejects_quantity_above_inventory(variant):
    with pytest.raises(ValidationError):
        checkout_as_guest([OrderLine(variant_id=variant.id, quantity=99)], CONTACT)


@pytest.mark.django_db
def test_guest_checkout_rejects_unknown_variant():
    with pytest.raises(ValidationError):
        checkout_as_guest([OrderLine(variant_id=999999, quantity=1)], CONTACT)


@pytest.mark.django_db
def test_session_cart_checkout_clears_cart(variant, db):
    from apps.cart.models import CartItem
    from django.contrib.sessions.backends.db import SessionStore

    store = SessionStore()
    store.create()
    session_key = store.session_key
    cart_service.add_item(None, variant_id=variant.id, quantity=1, session_key=session_key)

    order = checkout_from_session_cart(session_key, CONTACT)

    assert order.customer_id is None
    assert CartItem.objects.filter(cart__session_key=session_key).count() == 0
    variant.refresh_from_db()
    assert variant.inventory_count == 4


@pytest.mark.django_db
def test_cod_checkout_skips_pending_payment_and_is_processing(customer_user, variant):
    from apps.orders.models import OrderStatus, PaymentMethod

    cart_service.add_item(customer_user, variant_id=variant.id, quantity=1)
    order = checkout_from_cart(
        customer_user, CONTACT, payment_method=PaymentMethod.CASH_ON_DELIVERY
    )

    assert order.payment_method == PaymentMethod.CASH_ON_DELIVERY
    assert order.status == OrderStatus.PROCESSING
    assert order.payments.count() == 0


@pytest.mark.django_db
def test_manual_checkout_defaults_to_pending_payment(customer_user, variant):
    from apps.orders.models import OrderStatus, PaymentMethod

    cart_service.add_item(customer_user, variant_id=variant.id, quantity=1)
    order = checkout_from_cart(customer_user, CONTACT)

    assert order.payment_method == PaymentMethod.MANUAL_TRANSFER
    assert order.status == OrderStatus.PENDING_PAYMENT
