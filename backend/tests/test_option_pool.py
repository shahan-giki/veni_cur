import pytest
from rest_framework.test import APIClient

from apps.catalog.models import Category
from apps.catalog.services.option_pool_service import (
    list_active_options,
    normalize_variant_attributes,
    seed_variant_options,
)


@pytest.mark.django_db
def test_seed_and_list_options_marks_skincare_recommendations():
    Category.objects.create(
        name="Skincare", slug="skincare", sort_order=1, is_active=True, is_visible=True
    )
    result = seed_variant_options()
    assert result["created"] >= 1

    rows = list_active_options(category_slug="skincare")
    keys = [r["key"] for r in rows]
    assert "volume" in keys
    assert "skin_type" in keys
    volume = next(r for r in rows if r["key"] == "volume")
    assert volume["recommended"] is True
    assert volume["kind"] == "text"


@pytest.mark.django_db
def test_normalize_variant_attributes_drops_blanks():
    assert normalize_variant_attributes(
        {"color": "Taupe", "color_hex": "#8b7355", "volume": "  ", "size": None}
    ) == {"color": "Taupe", "color_hex": "#8b7355"}


@pytest.mark.django_db
def test_admin_variant_options_api(admin_user):
    Category.objects.create(
        name="Shawls", slug="shawls", sort_order=1, is_active=True, is_visible=True
    )
    seed_variant_options()
    client = APIClient()
    client.force_login(admin_user)
    res = client.get("/api/v1/admin/variant-options/?category_slug=shawls")
    assert res.status_code == 200
    keys = [row["key"] for row in res.data]
    assert "material" in keys
    assert "color" in keys
