from dataclasses import dataclass
from decimal import Decimal

from apps.catalog.models import Product, ProductVariant


def effective_variant_unit_price(variant: ProductVariant) -> Decimal:
    """Authoritative unit price for storefront/cart, resolved per variant."""
    price = variant.price if variant.price is not None else variant.product.base_price
    if variant.product.sale_price is not None:
        price = variant.product.sale_price
    return Decimal(price)


@dataclass(frozen=True)
class ProductPriceSummary:
    """A Product's storefront price: the lowest one a Customer could pay."""

    amount: Decimal
    varies: bool


def effective_product_price(product: Product) -> ProductPriceSummary:
    """Lowest Effective price across a Product's active variants.

    ``varies`` is True when active variants disagree, so callers can render "from X".
    Reads ``product.variants.all()``, so callers must prefetch active variants
    (``product_service.published_products`` does) or this costs a query per Product.
    Products with no active variant fall back to their own sale/base price.
    """
    prices = [
        effective_variant_unit_price(variant)
        for variant in product.variants.all()
        if variant.is_active
    ]
    if not prices:
        fallback = (
            product.sale_price if product.sale_price is not None else product.base_price
        )
        return ProductPriceSummary(amount=Decimal(fallback), varies=False)
    return ProductPriceSummary(amount=min(prices), varies=min(prices) != max(prices))
