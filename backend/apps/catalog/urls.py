from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.catalog.views import (
    AdminCategoryViewSet,
    AdminProductImageViewSet,
    AdminProductVariantViewSet,
    AdminProductViewSet,
    PublicCategoryViewSet,
    PublicProductViewSet,
    admin_variant_options,
)

public_router = DefaultRouter()
public_router.register("categories", PublicCategoryViewSet, basename="public-category")
public_router.register("products", PublicProductViewSet, basename="public-product")

admin_router = DefaultRouter()
admin_router.register("categories", AdminCategoryViewSet, basename="admin-category")
admin_router.register("products", AdminProductViewSet, basename="admin-product")
admin_router.register("variants", AdminProductVariantViewSet, basename="admin-variant")

urlpatterns = [
    path("", include(public_router.urls)),
    path(
        "admin/variant-options/",
        admin_variant_options,
        name="admin-variant-options",
    ),
    path(
        "admin/products/<int:product_pk>/images/",
        AdminProductImageViewSet.as_view({"get": "list"}),
        name="admin-product-images-list",
    ),
    path(
        "admin/products/<int:product_pk>/images/presign-upload/",
        AdminProductImageViewSet.as_view({"post": "presign_upload"}),
        name="admin-product-images-presign",
    ),
    path(
        "admin/products/<int:product_pk>/images/confirm-upload/",
        AdminProductImageViewSet.as_view({"post": "confirm_upload"}),
        name="admin-product-images-confirm",
    ),
    path(
        "admin/products/<int:product_pk>/images/reorder/",
        AdminProductImageViewSet.as_view({"post": "reorder"}),
        name="admin-product-images-reorder",
    ),
    path(
        "admin/products/<int:product_pk>/images/<int:pk>/",
        AdminProductImageViewSet.as_view({"delete": "destroy"}),
        name="admin-product-images-detail",
    ),
    path("admin/", include(admin_router.urls)),
]
