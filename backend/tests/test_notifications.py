import logging

import pytest
from django.core import mail

from apps.catalog.models import Category, Product, ProductStatus, ProductVariant
from apps.orders.models import Order, OrderItem, OrderStatus, PaymentMethod
from common.notifications import notify


@pytest.fixture
def sample_order(db):
    category = Category.objects.create(
        name="Skincare", slug="skincare", sort_order=1, is_active=True, is_visible=True
    )
    product = Product.objects.create(
        category=category,
        name="Hydrating Serum",
        slug="hydrating-serum",
        description="Test",
        base_price="1999.00",
        status=ProductStatus.PUBLISHED,
        is_active=True,
    )
    variant = ProductVariant.objects.create(
        product=product,
        sku="serum-default",
        label="30ml",
        is_default=True,
        inventory_count=10,
    )
    order = Order.objects.create(
        customer=None,
        contact_name="Ayesha Khan",
        contact_phone="+92 300 1234567",
        contact_email="ayesha@example.test",
        shipping_address="12 Jinnah Road",
        shipping_city="Lahore",
        payment_method=PaymentMethod.MANUAL_TRANSFER,
        status=OrderStatus.PENDING_PAYMENT,
        subtotal="1999.00",
        total="1999.00",
        courier_name="TCS",
        courier_tracking_number="TCS123456789",
    )
    OrderItem.objects.create(
        order=order,
        product=product,
        product_variant=variant,
        product_name_snapshot="Hydrating Serum",
        variant_label_snapshot="30ml",
        variant_attributes_snapshot={},
        sku_snapshot="serum-default",
        unit_price="1999.00",
        quantity=1,
        line_total="1999.00",
    )
    return order


@pytest.mark.django_db
def test_order_created_email_includes_brand_and_order_details(settings, sample_order):
    settings.EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
    settings.VENI_NOTIFICATIONS_CONSOLE = False
    settings.DEFAULT_FROM_EMAIL = "noreply@veni.test"
    settings.VENI_STOREFRONT_URL = "https://shop.veni.test"

    notify(
        "order_created",
        email=sample_order.contact_email,
        context={"order_id": sample_order.id},
    )

    assert len(mail.outbox) == 1
    message = mail.outbox[0]
    assert message.to == ["ayesha@example.test"]
    assert "VENI-000" in message.subject or "order" in message.subject.lower()
    assert "Hydrating Serum" in message.body
    assert "Lahore" in message.body
    assert "1999" in message.body or "1,999" in message.body
    html = message.alternatives[0][0]
    assert "VENI" in html
    assert "Hydrating Serum" in html
    assert "letter-spacing" in html or "VENI" in html
    assert sample_order.contact_name in html


@pytest.mark.django_db
def test_order_shipped_email_includes_tracking(settings, sample_order):
    settings.EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
    settings.VENI_NOTIFICATIONS_CONSOLE = False
    settings.DEFAULT_FROM_EMAIL = "noreply@veni.test"

    notify(
        "order_shipped",
        email=sample_order.contact_email,
        context={"order_id": sample_order.id},
    )

    message = mail.outbox[0]
    assert "TCS123456789" in message.body
    html = message.alternatives[0][0]
    assert "TCS123456789" in html
    assert "TCS" in html


@pytest.mark.django_db
def test_notify_sends_mail_and_logs_console(settings, caplog):
    settings.EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
    settings.VENI_NOTIFICATIONS_CONSOLE = True
    settings.DEFAULT_FROM_EMAIL = "noreply@veni.test"
    with caplog.at_level(logging.INFO, logger="veni.notifications"):
        notify("order_created", email="buyer@example.test", context={"order_id": 42})
    # No Order row for id 42 — still sends a minimal mail without crashing
    assert len(mail.outbox) == 1
    assert mail.outbox[0].to == ["buyer@example.test"]
    assert "order_created" in caplog.text


@pytest.mark.django_db
def test_notify_skips_empty_email(settings):
    settings.EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
    notify("order_created", email="", context={"order_id": 1})
    assert mail.outbox == []
