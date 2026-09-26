from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Prefetch, Q
from django.shortcuts import get_object_or_404
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from apps.catalog.models import (
    Category,
    Product,
    ProductImage,
    ProductStatus,
    ProductVariant,
)
from apps.catalog.serializers import (
    AdminCategorySerializer,
    AdminProductImageSerializer,
    AdminProductSerializer,
    AdminProductVariantSerializer,
    ConfirmImageUploadSerializer,
    InventoryUpdateSerializer,
    PresignUploadRequestSerializer,
    PublicCategoryDetailSerializer,
    PublicCategorySerializer,
    PublicProductDetailSerializer,
    PublicProductListSerializer,
    ReorderImagesSerializer,
)
from apps.catalog.services import (
    category_service,
    product_image_service,
    product_service,
    variant_service,
)
from apps.catalog.services.s3_storage import get_product_image_storage
from common.pagination import VeniPageNumberPagination
from common.permissions import IsAdmin


def _image_urls_for_keys(s3_keys: list[str]) -> dict[str, str]:
    if not s3_keys:
        return {}
    storage = get_product_image_storage()
    return {key: storage.create_presigned_read(s3_key=key).url for key in s3_keys}


def _product_image_keys(product: Product) -> list[str]:
    return list(product.images.values_list("s3_key", flat=True))


class PublicCategoryViewSet(
    mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet
):
    serializer_class = PublicCategorySerializer
    lookup_field = "slug"
    pagination_class = None

    def get_queryset(self):
        qs = Category.objects.filter(is_active=True, is_visible=True)
        if self.action == "retrieve":
            qs = qs.prefetch_related(
                Prefetch(
                    "children",
                    queryset=Category.objects.filter(is_active=True, is_visible=True),
                )
            )
        return qs

    def get_serializer_class(self):
        if self.action == "retrieve":
            return PublicCategoryDetailSerializer
        return PublicCategorySerializer


class PublicProductViewSet(
    mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet
):
    lookup_field = "slug"
    pagination_class = VeniPageNumberPagination

    def get_queryset(self):
        qs = (
            Product.objects.filter(
                is_active=True,
                status=ProductStatus.PUBLISHED,
                category__is_active=True,
                category__is_visible=True,
            )
            .select_related("category")
            .prefetch_related(
                "images",
                Prefetch(
                    "variants",
                    queryset=ProductVariant.objects.filter(is_active=True),
                ),
            )
        )
        category_slug = self.request.query_params.get("category")
        if category_slug:
            qs = qs.filter(category__slug=category_slug)
        q = self.request.query_params.get("q")
        if q:
            qs = qs.filter(
                Q(name__icontains=q)
                | Q(description__icontains=q)
                | Q(sku__icontains=q)
                | Q(variants__sku__icontains=q)
            ).distinct()
        ordering = self.request.query_params.get("ordering", "name")
        allowed = {
            "name",
            "-name",
            "created_at",
            "-created_at",
            "base_price",
            "-base_price",
        }
        if ordering in allowed:
            qs = qs.order_by(ordering)
        else:
            qs = qs.order_by("name")
        return qs

    def get_serializer_class(self):
        if self.action == "retrieve":
            return PublicProductDetailSerializer
        return PublicProductListSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        products = page if page is not None else list(queryset)
        keys: list[str] = []
        for product in products:
            keys.extend(_product_image_keys(product))
        ctx = {
            "image_urls": _image_urls_for_keys(keys),
            **self.get_serializer_context(),
        }
        serializer = self.get_serializer(products, many=True, context=ctx)
        if page is not None:
            return self.get_paginated_response(serializer.data)
        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        keys = _product_image_keys(instance)
        serializer = self.get_serializer(
            instance,
            context={
                **self.get_serializer_context(),
                "image_urls": _image_urls_for_keys(keys),
            },
        )
        return Response(serializer.data)


class AdminCategoryViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdmin]
    serializer_class = AdminCategorySerializer
    queryset = Category.objects.all().order_by("sort_order", "name")
    pagination_class = VeniPageNumberPagination

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        category = category_service.create_category(**serializer.validated_data)
        return Response(
            AdminCategorySerializer(category).data,
            status=status.HTTP_201_CREATED,
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        category = category_service.update_category(
            instance, **serializer.validated_data
        )
        return Response(AdminCategorySerializer(category).data)

    @action(detail=True, methods=["post"])
    def deactivate(self, request, pk=None):
        category = category_service.deactivate_category(self.get_object())
        return Response(AdminCategorySerializer(category).data)

    def destroy(self, request, *args, **kwargs):
        category = self.get_object()
        try:
            category_service.delete_category_if_safe(category)
        except DjangoValidationError as exc:
            detail = exc.message_dict if hasattr(exc, "message_dict") else exc.messages
            raise ValidationError(detail=detail)
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminProductViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdmin]
    serializer_class = AdminProductSerializer
    queryset = Product.objects.select_related("category").all()
    pagination_class = VeniPageNumberPagination

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product = product_service.create_product(**serializer.validated_data)
        return Response(
            AdminProductSerializer(product).data,
            status=status.HTTP_201_CREATED,
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        product = product_service.update_product(instance, **serializer.validated_data)
        return Response(AdminProductSerializer(product).data)

    @action(detail=True, methods=["post"])
    def deactivate(self, request, pk=None):
        product = product_service.set_product_active(self.get_object(), is_active=False)
        return Response(AdminProductSerializer(product).data)

    @action(detail=True, methods=["post"])
    def activate(self, request, pk=None):
        product = product_service.set_product_active(self.get_object(), is_active=True)
        return Response(AdminProductSerializer(product).data)


class AdminProductVariantViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdmin]
    serializer_class = AdminProductVariantSerializer
    pagination_class = VeniPageNumberPagination

    def get_queryset(self):
        qs = ProductVariant.objects.select_related("product")
        product_id = self.request.query_params.get("product")
        if product_id:
            qs = qs.filter(product_id=product_id)
        return qs

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        variant = variant_service.create_variant(**serializer.validated_data)
        return Response(
            AdminProductVariantSerializer(variant).data,
            status=status.HTTP_201_CREATED,
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        variant = variant_service.update_variant(instance, **serializer.validated_data)
        return Response(AdminProductVariantSerializer(variant).data)

    @action(detail=True, methods=["patch"])
    def inventory(self, request, pk=None):
        body = InventoryUpdateSerializer(data=request.data)
        body.is_valid(raise_exception=True)
        variant = variant_service.adjust_inventory(
            self.get_object(),
            body.validated_data["inventory_count"],
        )
        return Response(AdminProductVariantSerializer(variant).data)


class AdminProductImageViewSet(
    mixins.ListModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [IsAdmin]
    serializer_class = AdminProductImageSerializer

    def get_queryset(self):
        product_id = self.kwargs.get("product_pk")
        return ProductImage.objects.filter(product_id=product_id).order_by(
            "sort_order", "id"
        )

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        keys = list(qs.values_list("s3_key", flat=True))
        serializer = self.get_serializer(
            qs,
            many=True,
            context={
                "image_urls": _image_urls_for_keys(keys),
                **self.get_serializer_context(),
            },
        )
        return Response(serializer.data)

    @action(detail=False, methods=["post"], url_path="presign-upload")
    def presign_upload(self, request, product_pk=None):
        product = get_object_or_404(Product, pk=product_pk)
        body = PresignUploadRequestSerializer(data=request.data)
        body.is_valid(raise_exception=True)
        try:
            presigned = product_image_service.request_upload_presign(
                product=product,
                **body.validated_data,
            )
        except DjangoValidationError as exc:
            detail = exc.message_dict if hasattr(exc, "message_dict") else exc.messages
            raise ValidationError(detail=detail)
        return Response(
            {
                "upload_url": presigned.url,
                "fields": presigned.fields,
                "s3_key": presigned.s3_key,
                "expires_in": presigned.expires_in,
            }
        )

    @action(detail=False, methods=["post"], url_path="confirm-upload")
    def confirm_upload(self, request, product_pk=None):
        product = get_object_or_404(Product, pk=product_pk)
        body = ConfirmImageUploadSerializer(data=request.data)
        body.is_valid(raise_exception=True)
        image = product_image_service.confirm_product_image(
            product=product,
            **body.validated_data,
        )
        urls = _image_urls_for_keys([image.s3_key])
        return Response(
            AdminProductImageSerializer(
                image,
                context={"image_urls": urls},
            ).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=["post"], url_path="reorder")
    def reorder(self, request, product_pk=None):
        product = get_object_or_404(Product, pk=product_pk)
        body = ReorderImagesSerializer(data=request.data)
        body.is_valid(raise_exception=True)
        try:
            product_image_service.reorder_images(
                product,
                body.validated_data["ordered_image_ids"],
            )
        except DjangoValidationError as exc:
            detail = exc.message_dict if hasattr(exc, "message_dict") else exc.messages
            raise ValidationError(detail=detail)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def perform_destroy(self, instance):
        product_image_service.delete_product_image(instance)
