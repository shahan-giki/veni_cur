import pytest

from apps.catalog.models import Product, ProductStatus


@pytest.mark.django_db
def test_public_lists_visible_categories(api_client, category):
    resp = api_client.get("/api/v1/categories/")
    assert resp.status_code == 200
    assert resp.data[0]["slug"] == "skincare"


@pytest.mark.django_db
def test_hidden_category_not_in_public_list(api_client, category):
    category.is_visible = False
    category.save()
    resp = api_client.get("/api/v1/categories/")
    assert resp.data == []


@pytest.mark.django_db
def test_public_product_list_and_detail(api_client, published_product):
    list_resp = api_client.get("/api/v1/products/")
    assert list_resp.status_code == 200
    assert list_resp.data["count"] == 1
    default_variant = published_product.variants.get(is_default=True)
    assert list_resp.data["results"][0]["default_variant_id"] == default_variant.id
    detail = api_client.get("/api/v1/products/test-serum/")
    assert detail.status_code == 200
    assert detail.data["slug"] == "test-serum"
    assert len(detail.data["variants"]) == 1


@pytest.mark.django_db
def test_draft_product_hidden(api_client, category):
    Product.objects.create(
        category=category,
        name="Draft",
        slug="draft-item",
        base_price="9.99",
        status=ProductStatus.DRAFT,
        is_active=True,
    )
    resp = api_client.get("/api/v1/products/")
    assert resp.data["count"] == 0


@pytest.mark.django_db
def test_search_and_category_filter(api_client, published_product, category):
    resp = api_client.get("/api/v1/products/", {"q": "serum", "category": "skincare"})
    assert resp.data["count"] == 1
    resp2 = api_client.get("/api/v1/products/", {"category": "missing"})
    assert resp2.data["count"] == 0


@pytest.mark.django_db
def test_customer_cannot_create_category(api_client, customer_user, category):
    api_client.force_login(customer_user)
    resp = api_client.post(
        "/api/v1/admin/categories/",
        {"name": "Hack", "slug": "hack", "sort_order": 99},
        format="json",
    )
    assert resp.status_code == 403


@pytest.mark.django_db
def test_admin_can_create_category(api_client, admin_user):
    api_client.force_login(admin_user)
    resp = api_client.post(
        "/api/v1/admin/categories/",
        {
            "name": "Bags",
            "slug": "bags",
            "sort_order": 60,
            "is_active": True,
            "is_visible": True,
        },
        format="json",
    )
    assert resp.status_code == 201
    assert resp.data["slug"] == "bags"


@pytest.mark.django_db
def test_unauthenticated_admin_mutation_forbidden(api_client):
    resp = api_client.post(
        "/api/v1/admin/categories/",
        {"name": "X", "slug": "x", "sort_order": 1},
        format="json",
    )
    assert resp.status_code == 403


@pytest.mark.django_db
def test_admin_presign_requires_auth(api_client, published_product):
    resp = api_client.post(
        f"/api/v1/admin/products/{published_product.pk}/images/presign-upload/",
        {"content_type": "image/png", "byte_size": 1000},
        format="json",
    )
    assert resp.status_code == 403


@pytest.mark.django_db
def test_search_by_variant_sku(api_client, published_product):
    variant = published_product.variants.first()
    resp = api_client.get("/api/v1/products/", {"q": variant.sku[:8]})
    assert resp.data["count"] == 1


@pytest.mark.django_db
def test_product_pagination(api_client, category):
    from apps.catalog.models import ProductStatus
    from apps.catalog.services import product_service

    for i in range(3):
        p = product_service.create_product(
            category=category,
            name=f"Item {i}",
            slug=f"item-{i}",
            base_price="10.00",
            status=ProductStatus.PUBLISHED,
        )
        p.is_active = True
        p.save()
    resp = api_client.get("/api/v1/products/", {"page_size": 2})
    assert resp.data["count"] == 3
    assert len(resp.data["results"]) == 2


@pytest.mark.django_db
def test_product_ordering(api_client, published_product, category):
    from apps.catalog.models import Product, ProductStatus

    Product.objects.create(
        category=category,
        name="Alpha",
        slug="alpha-z",
        base_price="5.00",
        status=ProductStatus.PUBLISHED,
        is_active=True,
    )
    resp = api_client.get("/api/v1/products/", {"ordering": "name"})
    names = [r["name"] for r in resp.data["results"]]
    assert names == sorted(names)


@pytest.mark.django_db
def test_category_detail_includes_children(api_client, category):
    from apps.catalog.models import Category

    Category.objects.create(
        name="Serums",
        slug="serums",
        parent=category,
        is_active=True,
        is_visible=True,
    )
    resp = api_client.get("/api/v1/categories/skincare/")
    assert resp.status_code == 200
    assert len(resp.data["children"]) == 1


@pytest.mark.django_db
def test_admin_cannot_delete_category_with_products(
    api_client, admin_user, category, published_product
):
    api_client.force_login(admin_user)
    resp = api_client.delete(f"/api/v1/admin/categories/{category.pk}/")
    assert resp.status_code == 400


@pytest.mark.django_db
def test_customer_cannot_presign_upload(api_client, customer_user, published_product):
    api_client.force_login(customer_user)
    resp = api_client.post(
        f"/api/v1/admin/products/{published_product.pk}/images/presign-upload/",
        {"content_type": "image/png", "byte_size": 500},
        format="json",
    )
    assert resp.status_code == 403


@pytest.mark.django_db
def test_admin_presign_rejects_invalid_mime(api_client, admin_user, published_product):
    api_client.force_login(admin_user)
    resp = api_client.post(
        f"/api/v1/admin/products/{published_product.pk}/images/presign-upload/",
        {"content_type": "application/pdf", "byte_size": 500},
        format="json",
    )
    assert resp.status_code == 400


@pytest.mark.django_db
def test_admin_presign_and_confirm(api_client, admin_user, published_product):
    api_client.force_login(admin_user)
    presign = api_client.post(
        f"/api/v1/admin/products/{published_product.pk}/images/presign-upload/",
        {"content_type": "image/png", "byte_size": 2048},
        format="json",
    )
    assert presign.status_code == 200
    confirm = api_client.post(
        f"/api/v1/admin/products/{published_product.pk}/images/confirm-upload/",
        {
            "s3_key": presign.data["s3_key"],
            "content_type": "image/png",
            "byte_size": 2048,
            "alt_text": "Packshot",
        },
        format="json",
    )
    assert confirm.status_code == 201


@pytest.mark.django_db
def test_admin_can_create_color_variant_visible_on_storefront(
    api_client, admin_user, published_product
):
    api_client.force_login(admin_user)
    create = api_client.post(
        "/api/v1/admin/variants/",
        {
            "product": published_product.pk,
            "sku": "test-serum-navy",
            "label": "Navy",
            "inventory_count": 4,
            "attributes": {"color": "Navy", "color_hex": "#1e3a5f"},
            "is_default": False,
            "is_active": True,
        },
        format="json",
    )
    assert create.status_code == 201, create.data
    assert create.data["attributes"]["color"] == "Navy"
    assert create.data["attributes"]["color_hex"] == "#1e3a5f"

    detail = api_client.get(f"/api/v1/products/{published_product.slug}/")
    assert detail.status_code == 200
    colors = [
        v["attributes"].get("color")
        for v in detail.data["variants"]
        if v.get("attributes")
    ]
    assert "Navy" in colors


@pytest.mark.django_db
def test_admin_can_delete_variant(api_client, admin_user, published_product):
    api_client.force_login(admin_user)
    create = api_client.post(
        "/api/v1/admin/variants/",
        {
            "product": published_product.pk,
            "sku": "test-serum-to-delete",
            "label": "Temp",
            "inventory_count": 1,
            "attributes": {"volume": "30ml"},
            "is_default": False,
            "is_active": True,
        },
        format="json",
    )
    assert create.status_code == 201, create.data
    variant_id = create.data["id"]

    deleted = api_client.delete(f"/api/v1/admin/variants/{variant_id}/")
    assert deleted.status_code == 204

    missing = api_client.get(f"/api/v1/admin/variants/{variant_id}/")
    assert missing.status_code == 404
