from dataclasses import dataclass
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import transaction

from apps.accounts.models import User
from apps.cart.models import Cart, CartItem
from apps.catalog.models import ProductVariant
from apps.catalog.services.pricing import effective_variant_unit_price
from apps.catalog.services.purchasability import validate_variant_purchasable
from apps.orders.models import Order, OrderItem, OrderStatus, PaymentMethod
from common.notifications import notify


@dataclass(frozen=True)
class ContactDetails:
    """Where an Order goes and who to reach about it. Frozen onto the Order."""

    name: str
    phone: str
    email: str
    address: str
    city: str


@dataclass(frozen=True)
class OrderLine:
    """One requested line. Quantity and price are re-validated server-side."""

    variant_id: int
    quantity: int


def _validate_line_quantity(quantity: int, inventory: int) -> None:
    if quantity < 1:
        raise ValidationError({"detail": "Invalid cart item quantity."})
    if quantity > inventory:
        raise ValidationError(
            {"detail": "Insufficient inventory for one or more items in your cart."}
        )


def _normalize_payment_method(payment_method: str | None) -> str:
    if not payment_method:
        return PaymentMethod.MANUAL_TRANSFER
    if payment_method not in PaymentMethod.values:
        raise ValidationError({"payment_method": "Choose a valid payment method."})
    return payment_method


def _place_order(
    lines: list[OrderLine],
    contact: ContactDetails,
    customer: User | None,
    *,
    payment_method: str = PaymentMethod.MANUAL_TRANSFER,
) -> Order:
    """Price, validate and freeze `lines` into an Order, decrementing inventory.

    Prices are always resolved here, never accepted from the caller.
    Cash on delivery skips proof upload and starts in PROCESSING for fulfillment.
    """
    if not lines:
        raise ValidationError({"detail": "Your cart is empty."})

    method = _normalize_payment_method(payment_method)
    initial_status = (
        OrderStatus.PROCESSING
        if method == PaymentMethod.CASH_ON_DELIVERY
        else OrderStatus.PENDING_PAYMENT
    )

    variants = {
        v.id: v
        for v in ProductVariant.objects.select_for_update()
        .filter(id__in=[line.variant_id for line in lines])
        .select_related("product", "product__category")
    }

    priced: list[tuple[OrderLine, ProductVariant, Decimal, Decimal]] = []
    subtotal = Decimal("0")

    for line in lines:
        variant = variants.get(line.variant_id)
        if variant is None:
            raise ValidationError(
                {"detail": "A product in your cart is no longer available."}
            )
        validate_variant_purchasable(variant)
        _validate_line_quantity(line.quantity, variant.inventory_count)
        unit_price = effective_variant_unit_price(variant)
        line_total = unit_price * line.quantity
        subtotal += line_total
        priced.append((line, variant, unit_price, line_total))

    order = Order.objects.create(
        customer=customer,
        contact_name=contact.name,
        contact_phone=contact.phone,
        contact_email=contact.email,
        shipping_address=contact.address,
        shipping_city=contact.city,
        payment_method=method,
        status=initial_status,
        subtotal=subtotal,
        total=subtotal,
    )

    for line, variant, unit_price, line_total in priced:
        OrderItem.objects.create(
            order=order,
            product=variant.product,
            product_variant=variant,
            product_name_snapshot=variant.product.name,
            variant_label_snapshot=variant.label,
            variant_attributes_snapshot=variant.attributes or {},
            sku_snapshot=variant.sku,
            unit_price=unit_price,
            quantity=line.quantity,
            line_total=line_total,
        )
        variant.inventory_count -= line.quantity
        variant.save(update_fields=["inventory_count", "updated_at"])

    order = (
        Order.objects.prefetch_related("items", "payments")
        .select_related("customer")
        .get(pk=order.pk)
    )
    notify(
        "order_created",
        email=order.contact_email,
        context={"order_id": order.id},
    )
    return order


@transaction.atomic
def checkout_from_cart(
    user: User,
    contact: ContactDetails,
    *,
    payment_method: str = PaymentMethod.MANUAL_TRANSFER,
) -> Order:
    """Place an Order from a signed-in Customer's server-side Cart, then empty it."""
    cart = Cart.objects.select_for_update().filter(user=user).first()
    if cart is None:
        raise ValidationError({"detail": "Your cart is empty."})

    cart_items = list(
        CartItem.objects.select_for_update().filter(cart=cart).order_by("id")
    )
    lines = [
        OrderLine(variant_id=item.product_variant_id, quantity=item.quantity)
        for item in cart_items
    ]

    order = _place_order(
        lines, contact, customer=user, payment_method=payment_method
    )

    CartItem.objects.filter(cart=cart).delete()
    cart.save(update_fields=["updated_at"])
    return order


@transaction.atomic
def checkout_from_session_cart(
    session_key: str,
    contact: ContactDetails,
    *,
    payment_method: str = PaymentMethod.MANUAL_TRANSFER,
) -> Order:
    """Place an Order from a guest session Cart, then empty it (ADR-0003)."""
    if not session_key:
        raise ValidationError({"detail": "Your cart is empty."})

    cart = Cart.objects.select_for_update().filter(session_key=session_key).first()
    if cart is None:
        raise ValidationError({"detail": "Your cart is empty."})

    cart_items = list(
        CartItem.objects.select_for_update().filter(cart=cart).order_by("id")
    )
    lines = [
        OrderLine(variant_id=item.product_variant_id, quantity=item.quantity)
        for item in cart_items
    ]

    order = _place_order(
        lines, contact, customer=None, payment_method=payment_method
    )

    CartItem.objects.filter(cart=cart).delete()
    cart.save(update_fields=["updated_at"])
    return order


@transaction.atomic
def checkout_as_guest(
    lines: list[OrderLine],
    contact: ContactDetails,
    *,
    payment_method: str = PaymentMethod.MANUAL_TRANSFER,
) -> Order:
    """Place an Order for a visitor with no account from explicit lines (tests / API).

    Prefer `checkout_from_session_cart` for storefront guests so the Cart clears.
    """
    return _place_order(
        lines, contact, customer=None, payment_method=payment_method
    )
