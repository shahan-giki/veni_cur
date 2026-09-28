"""Variant option pool — Postgres-backed definitions for Admin forms."""

from __future__ import annotations

from apps.catalog.models import (
    Category,
    CategoryOptionRecommendation,
    VariantOptionDefinition,
)
from apps.catalog.option_seed import OPTION_SEED


def seed_variant_options() -> dict[str, int]:
    """Idempotent upsert of option definitions + category recommendations."""
    created = updated = links = 0
    categories = {c.slug: c for c in Category.objects.all()}

    for (
        key,
        label,
        kind,
        placeholder,
        suggestions,
        recommend_all,
        sort_order,
        category_slugs,
    ) in OPTION_SEED:
        obj, was_created = VariantOptionDefinition.objects.update_or_create(
            key=key,
            defaults={
                "label": label,
                "kind": kind,
                "placeholder": placeholder,
                "suggestions": list(suggestions),
                "recommend_all": recommend_all,
                "sort_order": sort_order,
                "is_active": True,
            },
        )
        if was_created:
            created += 1
        else:
            updated += 1

        desired_slugs = set(category_slugs)
        if recommend_all:
            # Still link explicit category rows for sort priority in Admin UI
            pass
        for slug in desired_slugs:
            category = categories.get(slug)
            if category is None:
                continue
            _, link_created = CategoryOptionRecommendation.objects.update_or_create(
                category=category,
                option=obj,
                defaults={"sort_order": sort_order},
            )
            if link_created:
                links += 1

    return {"created": created, "updated": updated, "links_created": links}


def list_active_options(*, category_id: int | None = None, category_slug: str | None = None):
    """Return active option defs with recommended=True when matching category."""
    qs = VariantOptionDefinition.objects.filter(is_active=True).order_by(
        "sort_order", "label"
    )
    options = list(qs)

    recommended_ids: set[int] = set()
    category = None
    if category_id is not None:
        category = Category.objects.filter(pk=category_id).first()
    elif category_slug:
        category = Category.objects.filter(slug=category_slug).first()

    if category is not None:
        recommended_ids = set(
            CategoryOptionRecommendation.objects.filter(category=category).values_list(
                "option_id", flat=True
            )
        )

    payload = []
    for opt in options:
        recommended = opt.recommend_all or opt.id in recommended_ids
        payload.append(
            {
                "key": opt.key,
                "label": opt.label,
                "kind": opt.kind,
                "placeholder": opt.placeholder,
                "suggestions": opt.suggestions or [],
                "sort_order": opt.sort_order,
                "recommended": recommended,
            }
        )

    # Recommended first, then sort_order
    payload.sort(key=lambda row: (0 if row["recommended"] else 1, row["sort_order"], row["label"]))
    return payload


def normalize_variant_attributes(attributes: dict | None) -> dict:
    """Drop empty values; keep only str/int/float/bool scalars for Neon JSONB."""
    if not attributes:
        return {}
    cleaned: dict = {}
    for key, value in attributes.items():
        if value is None:
            continue
        if isinstance(value, str) and not value.strip():
            continue
        if isinstance(value, (str, int, float, bool)):
            cleaned[str(key)] = value.strip() if isinstance(value, str) else value
    return cleaned
