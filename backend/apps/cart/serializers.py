from decimal import Decimal

from rest_framework import serializers

from apps.cart.models import CartItem
from apps.cart.services import cart_service
from apps.catalog.services.pricing import effective_variant_unit_price


class CartItemWriteSerializer(serializers.Serializer):
    variant_id = serializers.IntegerField(min_value=1)
    quantity = serializers.IntegerField(min_value=1)


class CartItemQuantitySerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=1)


class CartItemSerializer(serializers.ModelSerializer):
    variant_id = serializers.IntegerField(source="product_variant_id", read_only=True)
    product_id = serializers.IntegerField(
        source="product_variant.product_id", read_only=True
    )
    product_name = serializers.CharField(
        source="product_variant.product.name", read_only=True
    )
    product_slug = serializers.SlugField(
        source="product_variant.product.slug", read_only=True
    )
    variant_label = serializers.CharField(
        source="product_variant.label", read_only=True
    )
    variant_attributes = serializers.JSONField(
        source="product_variant.attributes", read_only=True
    )
    sku = serializers.CharField(source="product_variant.sku", read_only=True)
    inventory_count = serializers.IntegerField(
        source="product_variant.inventory_count", read_only=True
    )
    unit_price = serializers.SerializerMethodField()
    line_total = serializers.SerializerMethodField()
    primary_image_url = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = (
            "id",
            "variant_id",
            "product_id",
            "product_name",
            "product_slug",
            "variant_label",
            "variant_attributes",
            "sku",
            "inventory_count",
            "unit_price",
            "quantity",
            "line_total",
            "primary_image_url",
        )
        read_only_fields = fields

    def get_unit_price(self, obj: CartItem) -> str:
        return str(effective_variant_unit_price(obj.product_variant))

    def get_line_total(self, obj: CartItem) -> str:
        unit = effective_variant_unit_price(obj.product_variant)
        total: Decimal = unit * obj.quantity
        return str(total)

    def get_primary_image_url(self, obj: CartItem) -> str | None:
        urls = self.context.get("image_urls") or {}
        key = self.context.get("primary_image_keys", {}).get(
            obj.product_variant.product_id
        )
        if not key:
            return None
        return urls.get(key)


class CartSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    items = CartItemSerializer(many=True)
    subtotal = serializers.CharField()
    item_count = serializers.IntegerField()
    line_count = serializers.IntegerField()
    updated_at = serializers.DateTimeField()


def serialize_cart(
    cart, *, image_urls: dict[str, str], primary_image_keys: dict[int, str]
):
    totals = cart_service.calculate_totals(cart)
    items = cart.items.all()
    item_data = CartItemSerializer(
        items,
        many=True,
        context={"image_urls": image_urls, "primary_image_keys": primary_image_keys},
    ).data
    return {
        "id": cart.id,
        "items": item_data,
        "subtotal": str(totals.subtotal),
        "item_count": totals.item_count,
        "line_count": totals.line_count,
        "updated_at": cart.updated_at,
    }
