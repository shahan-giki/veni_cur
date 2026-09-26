from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404

from apps.catalog.models import Product, ProductStatus, ProductVariant


def get_purchasable_variant(variant_id: int) -> ProductVariant:
    variant = get_object_or_404(
        ProductVariant.objects.select_related("product", "product__category"),
        pk=variant_id,
    )
    validate_variant_purchasable(variant)
    return variant


def validate_variant_purchasable(variant: ProductVariant) -> None:
    product: Product = variant.product
    if not variant.is_active:
        raise ValidationError("This variant is not available.")
    if not product.is_active or product.status != ProductStatus.PUBLISHED:
        raise ValidationError("This product is not available for purchase.")
    category = product.category
    if not category.is_active or not category.is_visible:
        raise ValidationError("This product is not available for purchase.")
