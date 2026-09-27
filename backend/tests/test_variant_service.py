import pytest
from django.core.exceptions import ValidationError

from apps.catalog.services import variant_service


@pytest.mark.django_db
def test_inventory_cannot_be_negative(published_product):
    variant = published_product.variants.first()
    with pytest.raises(ValidationError):
        variant_service.adjust_inventory(variant, -1)


@pytest.mark.django_db
def test_create_variant_stores_color_attributes(published_product):
    variant = variant_service.create_variant(
        product=published_product,
        sku="shawl-taupe-1",
        label="Taupe",
        inventory_count=3,
        attributes={"color": "Taupe", "color_hex": "#8b7355"},
    )
    variant.refresh_from_db()
    assert variant.attributes["color"] == "Taupe"
    assert variant.attributes["color_hex"] == "#8b7355"


@pytest.mark.django_db
def test_sku_unique(published_product, category):
    from apps.catalog.models import ProductStatus
    from apps.catalog.services import product_service

    other = product_service.create_product(
        category=category,
        name="Other",
        slug="other-product",
        base_price="10.00",
        status=ProductStatus.DRAFT,
    )
    with pytest.raises(Exception):
        variant_service.create_variant(
            product=other,
            sku="test-serum-default",
            label="Dup",
        )
