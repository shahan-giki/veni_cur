from rest_framework import serializers

from apps.orders.models import Order
from apps.orders.serializers import OrderItemSerializer
from apps.payments.models import Payment, PaymentStatus


class AdminPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = (
            "id",
            "status",
            "amount",
            "reference_number",
            "rejection_reason",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class AdminOrderCustomerSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    email = serializers.EmailField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()


class AdminOrderListSerializer(serializers.ModelSerializer):
    customer_email = serializers.EmailField(source="customer.email", read_only=True)
    item_count = serializers.SerializerMethodField()
    pending_payment_id = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = (
            "id",
            "status",
            "customer_email",
            "subtotal",
            "total",
            "item_count",
            "pending_payment_id",
            "created_at",
        )
        read_only_fields = fields

    def get_item_count(self, obj: Order) -> int:
        if hasattr(obj, "_item_count"):
            return obj._item_count  # noqa: SLF001
        return sum(item.quantity for item in obj.items.all())

    def get_pending_payment_id(self, obj: Order) -> int | None:
        pending = obj.payments.filter(status=PaymentStatus.PENDING).first()
        return pending.id if pending else None


class AdminOrderDetailSerializer(serializers.ModelSerializer):
    customer = serializers.SerializerMethodField()
    items = OrderItemSerializer(many=True, read_only=True)
    payments = AdminPaymentSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = (
            "id",
            "status",
            "customer",
            "subtotal",
            "total",
            "items",
            "payments",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields

    def get_customer(self, obj: Order) -> dict:
        user = obj.customer
        return {
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name or "",
            "last_name": user.last_name or "",
        }


class AdminOrderStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=[
            ("SHIPPED", "Shipped"),
            ("CANCELLED", "Cancelled"),
        ]
    )
