from django.conf import settings
from django.db import models
from django.db.models import CheckConstraint, Q, UniqueConstraint


class Cart(models.Model):
    """A basket owned by a Customer *or* an anonymous browser session — never both."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="cart",
        null=True,
        blank=True,
    )
    session_key = models.CharField(max_length=40, null=True, blank=True, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "cart_cart"
        constraints = [
            CheckConstraint(
                condition=(
                    Q(user__isnull=False, session_key__isnull=True)
                    | Q(user__isnull=True, session_key__isnull=False)
                ),
                name="cart_owner_xor",
            ),
        ]

    def __str__(self) -> str:
        if self.user_id:
            return f"Cart(user={self.user_id})"
        return f"Cart(session={self.session_key})"


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
