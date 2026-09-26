from django.conf import settings
from django.db import models
from django.db.models import CheckConstraint, Q, UniqueConstraint


class Cart(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="cart",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "cart_cart"

    def __str__(self) -> str:
        return f"Cart({self.user_id})"


class CartItem(models.Model):
    cart = models.ForeignKey(
        Cart,
        on_delete=models.CASCADE,
        related_name="items",
    )
    product_variant = models.ForeignKey(
        "catalog.ProductVariant",
        on_delete=models.CASCADE,
        related_name="cart_items",
    )
    quantity = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "cart_cartitem"
        constraints = [
            CheckConstraint(
                condition=Q(quantity__gte=1),
                name="cartitem_quantity_positive",
            ),
            UniqueConstraint(
                fields=["cart", "product_variant"],
                name="cartitem_unique_variant_per_cart",
            ),
        ]
        indexes = [
            models.Index(fields=["cart"]),
        ]

    def __str__(self) -> str:
        return f"CartItem({self.cart_id}, variant={self.product_variant_id})"
