from django.conf import settings
from django.db import models
from django.db.models import CheckConstraint, Q


class OrderStatus(models.TextChoices):
    PENDING_PAYMENT = "PENDING_PAYMENT", "Pending payment"
    PAYMENT_VERIFICATION = "PAYMENT_VERIFICATION", "Payment verification"
    PROCESSING = "PROCESSING", "Processing"
    SHIPPED = "SHIPPED", "Shipped"
    CANCELLED = "CANCELLED", "Cancelled"


class Order(models.Model):
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="orders",
    )
    status = models.CharField(
        max_length=32,
        choices=OrderStatus.choices,
        default=OrderStatus.PENDING_PAYMENT,
    )
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "orders_order"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["customer", "-created_at"]),
        ]
        constraints = [
            CheckConstraint(
                condition=Q(subtotal__gte=0),
                name="order_subtotal_non_negative",
            ),
            CheckConstraint(
                condition=Q(total__gte=0),
                name="order_total_non_negative",
            ),
        ]

    def __str__(self) -> str:
        return f"Order({self.pk})"


class OrderItem(models.Model):
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="items",
    )
    product = models.ForeignKey(
        "catalog.Product",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="order_items",
    )
    product_variant = models.ForeignKey(
        "catalog.ProductVariant",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="order_items",
    )
    product_name_snapshot = models.CharField(max_length=200)
    variant_label_snapshot = models.CharField(max_length=120, blank=True, default="")
    variant_attributes_snapshot = models.JSONField(default=dict, blank=True)
    sku_snapshot = models.CharField(max_length=64, blank=True, default="")
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    quantity = models.PositiveIntegerField()
    line_total = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        db_table = "orders_orderitem"
        constraints = [
            CheckConstraint(
                condition=Q(quantity__gte=1),
                name="orderitem_quantity_positive",
            ),
            CheckConstraint(
                condition=Q(unit_price__gte=0),
                name="orderitem_unit_price_non_negative",
            ),
            CheckConstraint(
                condition=Q(line_total__gte=0),
                name="orderitem_line_total_non_negative",
            ),
        ]

    def __str__(self) -> str:
        return f"OrderItem({self.order_id}, {self.product_name_snapshot})"
