from decimal import Decimal

from rest_framework import serializers

from apps.catalog.models import (
    Category,
    Product,
    ProductImage,
    ProductVariant,
)


class PublicCategorySerializer(serializers.ModelSerializer):
    parent_slug = serializers.SlugField(
        source="parent.slug", read_only=True, allow_null=True
    )

    class Meta:
        model = Category
        fields = (
            "id",
            "name",
            "slug",
            "parent",
            "parent_slug",
            "sort_order",
        )


class PublicCategoryChildSerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "slug", "sort_order")


class PublicCategoryDetailSerializer(PublicCategorySerializer):
    children = PublicCategoryChildSerializer(many=True, read_only=True)

    class Meta(PublicCategorySerializer.Meta):
        fields = PublicCategorySerializer.Meta.fields + ("children",)


class AdminCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = (
            "id",
            "name",
            "slug",
            "parent",
            "sort_order",
            "is_active",
            "is_visible",
            "image_s3_key",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("created_at", "updated_at")


class PublicProductVariantSerializer(serializers.ModelSerializer):
    effective_price = serializers.SerializerMethodField()

    class Meta:
        model = ProductVariant
        fields = (
            "id",
            "sku",
            "label",
            "effective_price",
            "inventory_count",
            "attributes",
            "is_default",
        )

    def get_effective_price(self, obj: ProductVariant) -> str:
        price = obj.price if obj.price is not None else obj.product.base_price
        if obj.product.sale_price is not None:
            price = obj.product.sale_price
        return str(price)


class PublicProductImageSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ("id", "alt_text", "sort_order", "url")

    def get_url(self, obj: ProductImage) -> str | None:
        urls = self.context.get("image_urls") or {}
        return urls.get(obj.s3_key)


class PublicProductListSerializer(serializers.ModelSerializer):
    category_slug = serializers.CharField(source="category.slug", read_only=True)
    effective_price = serializers.SerializerMethodField()
    primary_image_url = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            "id",
            "name",
            "slug",
            "category_slug",
            "description",
            "effective_price",
            "primary_image_url",
        )

    def get_effective_price(self, obj: Product) -> str:
        price = obj.sale_price if obj.sale_price is not None else obj.base_price
        return str(price)

    def get_primary_image_url(self, obj: Product) -> str | None:
        image = obj.images.order_by("sort_order", "id").first()
        if not image:
            return None
        urls = self.context.get("image_urls") or {}
        return urls.get(image.s3_key)


class PublicProductDetailSerializer(PublicProductListSerializer):
    variants = PublicProductVariantSerializer(many=True, read_only=True)
    images = PublicProductImageSerializer(many=True, read_only=True)

    class Meta(PublicProductListSerializer.Meta):
        fields = PublicProductListSerializer.Meta.fields + ("variants", "images")


class AdminProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = (
            "id",
            "product",
            "sku",
            "label",
            "price",
            "inventory_count",
            "attributes",
            "is_default",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("created_at", "updated_at")


class AdminProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = (
            "id",
            "category",
            "name",
            "slug",
            "description",
            "base_price",
            "sale_price",
            "sku",
            "status",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("created_at", "updated_at")

    def validate(self, attrs):
        base = attrs.get("base_price", getattr(self.instance, "base_price", None))
        sale = attrs.get("sale_price", getattr(self.instance, "sale_price", None))
        if base is not None and sale is not None and sale > base:
            raise serializers.ValidationError(
                {"sale_price": "Sale price cannot exceed base price."}
            )
        if base is not None and base < Decimal("0"):
            raise serializers.ValidationError(
                {"base_price": "Price cannot be negative."}
            )
        return attrs


class AdminProductImageSerializer(serializers.ModelSerializer):
    read_url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = (
            "id",
            "product",
            "s3_key",
            "alt_text",
            "sort_order",
            "content_type",
            "byte_size",
            "read_url",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("s3_key", "created_at", "updated_at")

    def get_read_url(self, obj: ProductImage) -> str | None:
        urls = self.context.get("image_urls") or {}
        return urls.get(obj.s3_key)


class PresignUploadRequestSerializer(serializers.Serializer):
    content_type = serializers.CharField(max_length=100)
    byte_size = serializers.IntegerField(min_value=1)


class ConfirmImageUploadSerializer(serializers.Serializer):
    s3_key = serializers.CharField(max_length=512)
    alt_text = serializers.CharField(max_length=255, required=False, default="")
    content_type = serializers.CharField(max_length=100, required=False, default="")
    byte_size = serializers.IntegerField(required=False, allow_null=True)


class ReorderImagesSerializer(serializers.Serializer):
    ordered_image_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        allow_empty=True,
    )


class InventoryUpdateSerializer(serializers.Serializer):
    inventory_count = serializers.IntegerField(min_value=0)
