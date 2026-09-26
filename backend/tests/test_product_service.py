import pytest
from django.core.exceptions import ValidationError

from apps.catalog.models import ProductStatus, ProductVariant
from apps.catalog.services import product_service


@pytest.mark.django_db
def test_create_product_with_default_variant(category):
    product = product_service.create_product(
        category=category,
        name="Moisturizer",
        slug="moisturizer",
        base_price="19.99",
        status=ProductStatus.DRAFT,
    )
    variants = ProductVariant.objects.filter(product=product)
    assert variants.count() == 1
    assert variants.first().is_default is True


@pytest.mark.django_db
def test_sale_price_cannot_exceed_base(category):
    with pytest.raises(ValidationError):
        product_service.create_product(
            category=category,
            name="Bad",
            slug="bad-price",
            base_price="10.00",
            sale_price="15.00",
            status=ProductStatus.DRAFT,
        )


@pytest.mark.django_db
def test_negative_base_price_rejected(category):
    with pytest.raises(ValidationError):
        product_service.create_product(
            category=category,
            name="Bad",
            slug="bad-negative",
            base_price="-1.00",
            status=ProductStatus.DRAFT,
        )
