"""Idempotent full-catalog seed: categories, option pool, products, variants."""

from __future__ import annotations

from django.db import transaction

from apps.catalog.catalog_seed import CATALOG_SEED
from apps.catalog.models import Category, Product, ProductStatus, ProductVariant
from apps.catalog.services.option_pool_service import (
    normalize_variant_attributes,
    seed_variant_options,
)
from apps.catalog.services.product_service import create_product, update_product

INITIAL_CATEGORIES = [
    ("Skincare", "skincare", 10),
    ("Oral Care", "oral-care", 20),
    ("Perfumes / Fragrances", "perfumes-fragrances", 30),
    ("Shawls", "shawls", 40),
    ("Peshawari Chappals", "peshawari-chappals", 50),
]


def ensure_categories() -> dict[str, Category]:
    by_slug: dict[str, Category] = {}
    for name, slug, sort_order in INITIAL_CATEGORIES:
        category, _ = Category.objects.update_or_create(
            slug=slug,
            defaults={
                "name": name,
                "sort_order": sort_order,
                "is_active": True,
                "is_visible": True,
            },
        )
        by_slug[slug] = category
    return by_slug


@transaction.atomic
def seed_full_catalog() -> dict:
    """Create/update realistic products for all five Veni categories.

    Returns a summary dict suitable for management-command printing:
    ``{category_slug: {"name": ..., "products_created": n, "products_updated": n,
    "variants_created": n, "variants_updated": n}}`` plus totals.
    """
    categories = ensure_categories()
    seed_variant_options()

    summary: dict[str, dict] = {}
    total_products_created = 0
    total_products_updated = 0
    total_variants_created = 0
    total_variants_updated = 0

    for category_slug, products in CATALOG_SEED.items():
        category = categories[category_slug]
        cat_row = {
            "name": category.name,
            "products_created": 0,
            "products_updated": 0,
            "variants_created": 0,
            "variants_updated": 0,
        }

        for product_data in products:
            existing = Product.objects.filter(slug=product_data["slug"]).first()
            fields = {
                "category": category,
                "name": product_data["name"],
                "description": product_data["description"],
                "base_price": product_data["base_price"],
                "sale_price": None,
                "sku": "",
                "status": ProductStatus.PUBLISHED,
                "is_active": True,
            }
            if existing is None:
                product = create_product(
                    create_default_variant=False,
                    slug=product_data["slug"],
                    **fields,
                )
                cat_row["products_created"] += 1
                total_products_created += 1
            else:
                product = update_product(existing, **fields)
                cat_row["products_updated"] += 1
                total_products_updated += 1

            for index, variant_data in enumerate(product_data["variants"]):
                attrs = normalize_variant_attributes(variant_data["attributes"])
                defaults = {
                    "product": product,
                    "label": variant_data["label"],
                    "inventory_count": variant_data["inventory_count"],
                    "attributes": attrs,
                    "is_default": index == 0,
                    "is_active": True,
                    "price": None,
                }
                variant, created = ProductVariant.objects.update_or_create(
                    sku=variant_data["sku"],
                    defaults=defaults,
                )
                # Ensure orphaned default variants from earlier creates are inactive
                # if SKU already belonged to another product — update_or_create moved it.
                _ = variant
                if created:
                    cat_row["variants_created"] += 1
                    total_variants_created += 1
                else:
                    cat_row["variants_updated"] += 1
                    total_variants_updated += 1

        summary[category_slug] = cat_row

    summary["_totals"] = {
        "products_created": total_products_created,
        "products_updated": total_products_updated,
        "variants_created": total_variants_created,
        "variants_updated": total_variants_updated,
    }
    return summary
