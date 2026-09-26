import pytest
from django.core.exceptions import ValidationError

from apps.catalog.models import Category
from apps.catalog.services import category_service


@pytest.mark.django_db
def test_create_category_unique_slug():
    category_service.create_category(name="Skincare", slug="skincare")
    with pytest.raises(Exception):
        Category.objects.create(name="Other", slug="skincare")


@pytest.mark.django_db
def test_category_self_parent_rejected():
    cat = Category.objects.create(name="Root", slug="root")
    with pytest.raises(ValidationError):
        category_service.update_category(cat, parent=cat)


@pytest.mark.django_db
def test_category_circular_parent_rejected():
    parent = Category.objects.create(name="Parent", slug="parent")
    child = Category.objects.create(name="Child", slug="child", parent=parent)
    with pytest.raises(ValidationError):
        category_service.update_category(parent, parent=child)


@pytest.mark.django_db
def test_deactivate_category(category):
    category_service.deactivate_category(category)
    category.refresh_from_db()
    assert category.is_active is False


@pytest.mark.django_db
def test_delete_category_blocked_when_products_exist(category, published_product):
    with pytest.raises(ValidationError):
        category_service.delete_category_if_safe(category)
