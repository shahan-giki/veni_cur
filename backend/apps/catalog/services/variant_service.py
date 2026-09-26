from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import transaction

from apps.catalog.models import ProductVariant


def validate_variant_price(price: Decimal | None) -> None:
    if price is not None and Decimal(price) < 0:
        raise ValidationError({"price": "Variant price cannot be negative."})


@transaction.atomic
def create_variant(**fields) -> ProductVariant:
    validate_variant_price(fields.get("price"))
    variant = ProductVariant(**fields)
    variant.full_clean()
    variant.save()
    return variant


@transaction.atomic
def update_variant(variant: ProductVariant, **fields) -> ProductVariant:
    if "inventory_count" in fields and fields["inventory_count"] < 0:
        raise ValidationError({"inventory_count": "Inventory cannot be negative."})
    for key, value in fields.items():
        setattr(variant, key, value)
    validate_variant_price(variant.price)
    variant.full_clean()
    variant.save()
    return variant


@transaction.atomic
def adjust_inventory(variant: ProductVariant, inventory_count: int) -> ProductVariant:
    if inventory_count < 0:
        raise ValidationError({"inventory_count": "Inventory cannot be negative."})
    variant.inventory_count = inventory_count
    variant.save(update_fields=["inventory_count", "updated_at"])
    return variant
