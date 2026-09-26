from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Prefetch

from apps.accounts.models import User
from apps.cart.models import Cart, CartItem
from apps.catalog.models import ProductImage
from apps.catalog.services.pricing import effective_variant_unit_price
from apps.catalog.services.purchasability import (
    get_purchasable_variant,
    validate_variant_purchasable,
)


class CartTotals:
    __slots__ = ("subtotal", "item_count", "line_count")

    def __init__(self, subtotal: Decimal, item_count: int, line_count: int):
        self.subtotal = subtotal
        self.item_count = item_count
        self.line_count = line_count


def _validate_quantity(quantity: int, inventory: int) -> None:
    if quantity < 1:
        raise ValidationError({"quantity": "Quantity must be at least 1."})
    if quantity > inventory:
        raise ValidationError(
            {"quantity": "Requested quantity exceeds available inventory."}
        )


@transaction.atomic
def get_or_create_cart(user: User) -> Cart:
    cart, _ = Cart.objects.select_for_update().get_or_create(user=user)
    return cart


def get_cart_for_user(user: User) -> Cart:
    return get_or_create_cart(user)


def _cart_queryset():
    return Cart.objects.prefetch_related(
        Prefetch(
            "items",
            queryset=CartItem.objects.select_related(
                "product_variant",
                "product_variant__product",
                "product_variant__product__category",
            ).order_by("id"),
        )
    )


def get_cart_with_items(user: User) -> Cart:
    cart = get_or_create_cart(user)
    return _cart_queryset().get(pk=cart.pk)


def calculate_totals(cart: Cart) -> CartTotals:
    items = list(cart.items.all())
    subtotal = Decimal("0")
    item_count = 0
    for item in items:
        unit = effective_variant_unit_price(item.product_variant)
        subtotal += unit * item.quantity
        item_count += item.quantity
    return CartTotals(subtotal=subtotal, item_count=item_count, line_count=len(items))


@transaction.atomic
def add_item(user: User, *, variant_id: int, quantity: int) -> Cart:
    cart = get_or_create_cart(user)
    variant = get_purchasable_variant(variant_id)
    _validate_quantity(quantity, variant.inventory_count)

    item = (
        CartItem.objects.select_for_update()
        .filter(cart=cart, product_variant=variant)
        .first()
    )
    if item:
        new_qty = item.quantity + quantity
        _validate_quantity(new_qty, variant.inventory_count)
        item.quantity = new_qty
        item.save(update_fields=["quantity", "updated_at"])
    else:
        CartItem.objects.create(
            cart=cart,
            product_variant=variant,
            quantity=quantity,
        )
    cart.save(update_fields=["updated_at"])
    return get_cart_with_items(user)


@transaction.atomic
def update_item_quantity(user: User, *, item_id: int, quantity: int) -> Cart:
    cart = get_or_create_cart(user)
    item = (
        CartItem.objects.select_for_update()
        .select_related("product_variant", "product_variant__product")
        .filter(pk=item_id, cart=cart)
        .first()
    )
    if item is None:
        raise ValidationError({"detail": "Cart item not found."})

    validate_variant_purchasable(item.product_variant)
    _validate_quantity(quantity, item.product_variant.inventory_count)
    item.quantity = quantity
    item.save(update_fields=["quantity", "updated_at"])
    cart.save(update_fields=["updated_at"])
    return get_cart_with_items(user)


@transaction.atomic
def remove_item(user: User, *, item_id: int) -> Cart:
    cart = get_or_create_cart(user)
    deleted, _ = CartItem.objects.filter(pk=item_id, cart=cart).delete()
    if not deleted:
        raise ValidationError({"detail": "Cart item not found."})
    cart.save(update_fields=["updated_at"])
    return get_cart_with_items(user)


@transaction.atomic
def clear_cart(user: User) -> Cart:
    cart = get_or_create_cart(user)
    cart.items.all().delete()
    cart.save(update_fields=["updated_at"])
    return get_cart_with_items(user)


def primary_image_key_for_product(product_id: int) -> str | None:
    image = (
        ProductImage.objects.filter(product_id=product_id)
        .order_by("sort_order", "id")
        .values_list("s3_key", flat=True)
        .first()
    )
    return image or None
