from decimal import Decimal

from apps.catalog.models import ProductVariant


def effective_variant_unit_price(variant: ProductVariant) -> Decimal:
    """Authoritative unit price for storefront/cart (matches public API logic)."""
    price = variant.price if variant.price is not None else variant.product.base_price
    if variant.product.sale_price is not None:
        price = variant.product.sale_price
    return Decimal(price)
