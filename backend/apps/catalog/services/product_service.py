from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Prefetch, Q, QuerySet
from django.utils.text import slugify

from apps.catalog.models import Product, ProductStatus, ProductVariant

PUBLIC_PRODUCT_ORDERINGS = frozenset(
    {
        "name",
        "-name",
        "created_at",
        "-created_at",
        "base_price",
        "-base_price",
    }
)
DEFAULT_PUBLIC_PRODUCT_ORDERING = "name"


def published_products(
    *,
    category_slug: str | None = None,
    search: str | None = None,
    ordering: str | None = None,
) -> QuerySet[Product]:
    """Storefront-visible products: published and active, in a visible category.

    Unsupported ``ordering`` values fall back to name; callers pass raw query params.
    """
    qs = (
        Product.objects.filter(
            is_active=True,
            status=ProductStatus.PUBLISHED,
            category__is_active=True,
            category__is_visible=True,
        )
        .select_related("category")
        .prefetch_related(
            "images",
            Prefetch(
                "variants",
                queryset=ProductVariant.objects.filter(is_active=True),
            ),
        )
    )
    if category_slug:
        qs = qs.filter(category__slug=category_slug)
    if search:
        qs = qs.filter(
            Q(name__icontains=search)
            | Q(description__icontains=search)
            | Q(sku__icontains=search)
            | Q(variants__sku__icontains=search)
        ).distinct()
    if ordering not in PUBLIC_PRODUCT_ORDERINGS:
        ordering = DEFAULT_PUBLIC_PRODUCT_ORDERING
    return qs.order_by(ordering)


def validate_product_prices(base_price: Decimal, sale_price: Decimal | None) -> None:
    base_price = Decimal(base_price)
    if sale_price is not None:
        sale_price = Decimal(sale_price)
    if base_price < Decimal("0"):
        raise ValidationError({"base_price": "Price cannot be negative."})
    if sale_price is not None:
        if sale_price < Decimal("0"):
            raise ValidationError({"sale_price": "Sale price cannot be negative."})
        if sale_price > base_price:
            raise ValidationError(
                {"sale_price": "Sale price cannot exceed base price."}
            )


def _default_sku(product: Product) -> str:
    base = slugify(product.slug) or f"product-{product.pk or 'new'}"
    return f"{base}-default"[:64]


@transaction.atomic
def create_product(*, create_default_variant: bool = True, **fields) -> Product:
    validate_product_prices(fields["base_price"], fields.get("sale_price"))
    product = Product(**fields)
    product.full_clean()
    product.save()
    if create_default_variant:
        sku = fields.get("sku") or _default_sku(product)
        if ProductVariant.objects.filter(sku=sku).exists():
            sku = _default_sku(product) + f"-{product.pk}"[:64]
        ProductVariant.objects.create(
            product=product,
            sku=sku[:64],
            label="Default",
            is_default=True,
            inventory_count=0,
        )
    return product


@transaction.atomic
def update_product(product: Product, **fields) -> Product:
    for key, value in fields.items():
        setattr(product, key, value)
    validate_product_prices(product.base_price, product.sale_price)
    product.full_clean()
    product.save()
    return product


def set_product_active(product: Product, *, is_active: bool) -> Product:
    product.is_active = is_active
    product.save(update_fields=["is_active", "updated_at"])
    return product
