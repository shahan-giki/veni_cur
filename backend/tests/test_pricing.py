from decimal import Decimal

import pytest

from apps.catalog.services.pricing import effective_product_price


def _with_variants(product, *specs):
    """Replace the fixture's default variant so each test states its own prices."""
    product.variants.all().delete()
    for sku, price, is_active in specs:
        product.variants.create(
            sku=sku,
            label=sku,
            price=price,
            inventory_count=1,
            is_active=is_active,
        )
    return product


@pytest.mark.django_db
def test_lowest_active_variant_price_wins(published_product):
    _with_variants(published_product, ("cheap", "9.99", True), ("dear", "49.99", True))

    summary = effective_product_price(published_product)

    assert summary.amount == Decimal("9.99")
    assert summary.varies is True


@pytest.mark.django_db
def test_does_not_vary_when_variants_agree(published_product):
    _with_variants(published_product, ("a", "12.00", True), ("b", "12.00", True))

    summary = effective_product_price(published_product)

    assert summary.amount == Decimal("12.00")
    assert summary.varies is False


@pytest.mark.django_db
def test_inactive_variants_are_ignored(published_product):
    _with_variants(
        published_product, ("hidden", "1.00", False), ("visible", "20.00", True)
    )

    summary = effective_product_price(published_product)

    assert summary.amount == Decimal("20.00")
    assert summary.varies is False


@pytest.mark.django_db
def test_variant_without_price_falls_back_to_base_price(published_product):
    _with_variants(published_product, ("inherits", None, True))

    summary = effective_product_price(published_product)

    assert summary.amount == Decimal("29.99")
    assert summary.varies is False


@pytest.mark.django_db
def test_product_sale_price_overrides_variant_prices(published_product):
    published_product.sale_price = "5.00"
    published_product.save(update_fields=["sale_price"])
    _with_variants(published_product, ("a", "12.00", True), ("b", "30.00", True))

    summary = effective_product_price(published_product)

    assert summary.amount == Decimal("5.00")
    assert summary.varies is False


@pytest.mark.django_db
def test_falls_back_to_product_price_without_active_variants(published_product):
    _with_variants(published_product, ("gone", "1.00", False))

    summary = effective_product_price(published_product)

    assert summary.amount == Decimal("29.99")
    assert summary.varies is False
