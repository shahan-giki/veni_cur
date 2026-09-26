from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import transaction

from apps.accounts.models import User
from apps.cart.models import Cart, CartItem
from apps.catalog.models import ProductVariant
from apps.catalog.services.pricing import effective_variant_unit_price
from apps.catalog.services.purchasability import validate_variant_purchasable
from apps.orders.models import Order, OrderItem, OrderStatus


def _validate_line_quantity(quantity: int, inventory: int) -> None:
    if quantity < 1:
        raise ValidationError({"detail": "Invalid cart item quantity."})
    if quantity > inventory:
        raise ValidationError(
            {"detail": "Insufficient inventory for one or more items in your cart."}
        )


@transaction.atomic
def checkout_from_cart(user: User) -> Order:
    cart = (
        Cart.objects.select_for_update()
        .filter(user=user)
        .first()
    )
    if cart is None:
        raise ValidationError({"detail": "Your cart is empty."})

    cart_items = list(
        CartItem.objects.select_for_update()
        .filter(cart=cart)
        .order_by("id")
    )
    if not cart_items:
        raise ValidationError({"detail": "Your cart is empty."})

    variant_ids = [item.product_variant_id for item in cart_items]
    variants = {
        v.id: v
        for v in ProductVariant.objects.select_for_update()
        .filter(id__in=variant_ids)
        .select_related("product", "product__category")
    }

    priced_lines: list[tuple[CartItem, ProductVariant, Decimal, Decimal]] = []
    subtotal = Decimal("0")

    for cart_item in cart_items:
        variant = variants.get(cart_item.product_variant_id)
        if variant is None:
            raise ValidationError(
                {"detail": "A product in your cart is no longer available."}
            )
        validate_variant_purchasable(variant)
        _validate_line_quantity(cart_item.quantity, variant.inventory_count)
        unit_price = effective_variant_unit_price(variant)
        line_total = unit_price * cart_item.quantity
        subtotal += line_total
        priced_lines.append((cart_item, variant, unit_price, line_total))

    order = Order.objects.create(
        customer=user,
        status=OrderStatus.PENDING_PAYMENT,
        subtotal=subtotal,
        total=subtotal,
    )

    for _cart_item, variant, unit_price, line_total in priced_lines:
        OrderItem.objects.create(
            order=order,
            product=variant.product,
            product_variant=variant,
            product_name_snapshot=variant.product.name,
            variant_label_snapshot=variant.label,
            variant_attributes_snapshot=variant.attributes or {},
            sku_snapshot=variant.sku,
            unit_price=unit_price,
            quantity=_cart_item.quantity,
            line_total=line_total,
        )
        variant.inventory_count -= _cart_item.quantity
        variant.save(update_fields=["inventory_count", "updated_at"])

    CartItem.objects.filter(cart=cart).delete()
    cart.save(update_fields=["updated_at"])

    return (
        Order.objects.prefetch_related("items", "payments")
        .select_related("customer")
        .get(pk=order.pk)
    )
