from rest_framework import serializers

from apps.orders.models import Order, OrderItem, OrderStatus
from apps.payments.serializers import CustomerPaymentStateSerializer
from apps.payments.services import payment_service


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = (
            "id",
            "product_name_snapshot",
            "variant_label_snapshot",
            "variant_attributes_snapshot",
            "sku_snapshot",
            "unit_price",
            "quantity",
            "line_total",
        )
        read_only_fields = fields


class CheckoutContactSerializer(serializers.Serializer):
    """Field names match ContactDetails so the view maps straight through."""

    name = serializers.CharField(max_length=120)
    phone = serializers.CharField(max_length=32)
    email = serializers.EmailField()
    address = serializers.CharField()
    city = serializers.CharField(max_length=120)
    payment_method = serializers.ChoiceField(
        choices=[
            ("MANUAL_TRANSFER", "Bank / wallet transfer"),
            ("CASH_ON_DELIVERY", "Cash on delivery"),
        ],
        default="MANUAL_TRANSFER",
        required=False,
    )


class GuestOrderLineSerializer(serializers.Serializer):
    variant_id = serializers.IntegerField(min_value=1)
    quantity = serializers.IntegerField(min_value=1)


class GuestCheckoutSerializer(CheckoutContactSerializer):
    lines = GuestOrderLineSerializer(many=True, allow_empty=False)


class OrderListSerializer(serializers.ModelSerializer):
    item_count = serializers.SerializerMethodField()
    payment_status = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = (
            "id",
            "status",
            "payment_method",
            "subtotal",
            "total",
            "item_count",
            "payment_status",
            "created_at",
        )
        read_only_fields = fields

    def get_item_count(self, obj: Order) -> int:
        if hasattr(obj, "_item_count"):
            return obj._item_count  # noqa: SLF001
        return sum(item.quantity for item in obj.items.all())

    def get_payment_status(self, obj: Order) -> str | None:
        state = payment_service.customer_payment_state(obj)
        if obj.status == OrderStatus.PAYMENT_VERIFICATION:
            return "PENDING"
        return state["status"]


class OrderDetailSerializer(OrderListSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    payment = serializers.SerializerMethodField()

    class Meta(OrderListSerializer.Meta):
        fields = OrderListSerializer.Meta.fields + (
            "items",
            "payment",
            "updated_at",
            "contact_name",
            "contact_phone",
            "contact_email",
            "shipping_address",
            "shipping_city",
            "access_token",
        )

    def get_payment(self, obj: Order) -> dict:
        return CustomerPaymentStateSerializer(
            payment_service.customer_payment_state(obj)
        ).data
