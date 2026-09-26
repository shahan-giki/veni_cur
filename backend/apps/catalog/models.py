from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import CheckConstraint, Q


class Category(models.Model):
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=140, unique=True)
    parent = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="children",
    )
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    is_visible = models.BooleanField(default=True)
    image_s3_key = models.CharField(max_length=512, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["sort_order", "name"]
        verbose_name_plural = "categories"
        indexes = [
            models.Index(fields=["slug"]),
            models.Index(fields=["is_active", "is_visible", "sort_order"]),
        ]

    def __str__(self) -> str:
        return self.name


class ProductStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    PUBLISHED = "PUBLISHED", "Published"
    ARCHIVED = "ARCHIVED", "Archived"


class Product(models.Model):
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name="products",
    )
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True)
    description = models.TextField(blank=True, default="")
    base_price = models.DecimalField(max_digits=12, decimal_places=2)
    sale_price = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True
    )
    sku = models.CharField(max_length=64, blank=True, default="")
    status = models.CharField(
        max_length=20,
        choices=ProductStatus.choices,
        default=ProductStatus.DRAFT,
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            CheckConstraint(
                condition=Q(base_price__gte=0),
                name="product_base_price_non_negative",
            ),
            CheckConstraint(
                condition=Q(sale_price__isnull=True) | Q(sale_price__gte=0),
                name="product_sale_price_non_negative",
            ),
        ]
        indexes = [
            models.Index(fields=["slug"]),
            models.Index(fields=["status", "is_active"]),
            models.Index(fields=["category", "status"]),
        ]

    def __str__(self) -> str:
        return self.name

    def clean(self):
        super().clean()
        if self.sale_price is not None and self.sale_price > self.base_price:
            raise ValidationError(
                {"sale_price": "Sale price cannot exceed base price."}
            )


class ProductVariant(models.Model):
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="variants",
    )
    sku = models.CharField(max_length=64, unique=True)
    label = models.CharField(max_length=120)
    price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    inventory_count = models.PositiveIntegerField(default=0)
    attributes = models.JSONField(default=dict, blank=True)
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            CheckConstraint(
                condition=Q(price__isnull=True) | Q(price__gte=0),
                name="variant_price_non_negative",
            ),
        ]
        indexes = [
            models.Index(fields=["sku"]),
            models.Index(fields=["product", "is_active"]),
        ]

    def __str__(self) -> str:
        return f"{self.product.name} — {self.label}"


class ProductImage(models.Model):
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="images",
    )
    s3_key = models.CharField(max_length=512)
    alt_text = models.CharField(max_length=255, blank=True, default="")
    sort_order = models.PositiveIntegerField(default=0)
    content_type = models.CharField(max_length=100, blank=True, default="")
    byte_size = models.PositiveIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["sort_order", "id"]

    def __str__(self) -> str:
        return f"Image {self.id} for {self.product_id}"
