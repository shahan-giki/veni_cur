import pytest

from apps.catalog.models import Product, ProductStatus, ProductVariant
from apps.catalog.services.catalog_seed_service import seed_full_catalog


@pytest.mark.django_db
def test_seed_full_catalog_creates_published_active_products_and_variants():
    summary = seed_full_catalog()

    assert set(summary.keys()) - {"_totals"} == {
        "skincare",
        "oral-care",
        "perfumes-fragrances",
        "shawls",
        "peshawari-chappals",
    }
    totals = summary["_totals"]
    assert totals["products_created"] >= 15
    assert totals["variants_created"] >= 30

    products = Product.objects.filter(slug__in=[
        "rosehip-glow-face-oil",
        "oud-wood-attar",
        "pashmina-border-shawl",
        "classic-kaptaan-chappal",
        "herbal-miswak-toothpaste",
    ])
    assert products.count() == 5
    for product in products:
        assert product.is_active is True
        assert product.status == ProductStatus.PUBLISHED
        assert product.variants.filter(is_active=True).exists()

    perfume = Product.objects.get(slug="oud-wood-attar")
    assert perfume.variants.filter(attributes__volume="12ml").exists()

    shawl = Product.objects.get(slug="pashmina-border-shawl")
    assert shawl.variants.filter(attributes__color="Maroon").exists()

    chappal = Product.objects.get(slug="classic-kaptaan-chappal")
    sizes = {
        str(v)
        for v in ProductVariant.objects.filter(product=chappal).values_list(
            "attributes__footwear_size", flat=True
        )
    }
    assert {"40", "41", "42", "43"}.issubset(sizes)

    # Idempotent second run updates rather than duplicating
    second = seed_full_catalog()
    assert second["_totals"]["products_created"] == 0
    assert Product.objects.filter(slug="oud-wood-attar").count() == 1
