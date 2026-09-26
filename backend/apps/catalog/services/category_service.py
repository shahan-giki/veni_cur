from django.core.exceptions import ValidationError
from django.db import transaction

from apps.catalog.models import Category


def validate_parent(category: Category, new_parent: Category | None) -> None:
    if new_parent is None:
        return
    if category.pk and new_parent.pk == category.pk:
        raise ValidationError({"parent": "A category cannot be its own parent."})
    if category.pk:
        current = new_parent
        while current is not None:
            if current.pk == category.pk:
                raise ValidationError(
                    {"parent": "Circular category hierarchy is not allowed."}
                )
            current = current.parent
        if new_parent.pk in _descendant_ids(category):
            raise ValidationError(
                {"parent": "Cannot set parent to a descendant category."}
            )


def _descendant_ids(category: Category) -> set[int]:
    if not category.pk:
        return set()
    result: set[int] = set()
    stack = list(
        Category.objects.filter(parent_id=category.pk).values_list("pk", flat=True)
    )
    while stack:
        pk = stack.pop()
        if pk in result:
            continue
        result.add(pk)
        stack.extend(Category.objects.filter(parent_id=pk).values_list("pk", flat=True))
    return result


@transaction.atomic
def create_category(**fields) -> Category:
    parent = fields.get("parent")
    category = Category(**fields)
    validate_parent(category, parent)
    category.full_clean()
    category.save()
    return category


@transaction.atomic
def update_category(category: Category, **fields) -> Category:
    parent = fields.get("parent", category.parent)
    for key, value in fields.items():
        setattr(category, key, value)
    validate_parent(category, parent)
    category.full_clean()
    category.save()
    return category


def deactivate_category(category: Category) -> Category:
    category.is_active = False
    category.save(update_fields=["is_active", "updated_at"])
    return category


def delete_category_if_safe(category: Category) -> None:
    """Hard-delete only when no products or child categories exist."""
    if category.products.exists():
        raise ValidationError(
            {"detail": "Category has products. Deactivate instead of deleting."}
        )
    if category.children.exists():
        raise ValidationError(
            {"detail": "Category has child categories. Remove or reassign them first."}
        )
    category.delete()
