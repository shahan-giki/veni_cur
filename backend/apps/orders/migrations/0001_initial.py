import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("catalog", "0002_category_catalog_cat_slug_695af4_idx_and_more"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Order",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[("PENDING_PAYMENT", "Pending payment")],
                        default="PENDING_PAYMENT",
                        max_length=32,
                    ),
                ),
                ("subtotal", models.DecimalField(decimal_places=2, max_digits=12)),
                ("total", models.DecimalField(decimal_places=2, max_digits=12)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "customer",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="orders",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "orders_order",
                "ordering": ["-created_at"],
                "indexes": [
                    models.Index(
                        fields=["customer", "-created_at"],
                        name="orders_order_customer_created_idx",
                    )
                ],
                "constraints": [
                    models.CheckConstraint(
                        condition=models.Q(("subtotal__gte", 0)),
                        name="order_subtotal_non_negative",
                    ),
                    models.CheckConstraint(
                        condition=models.Q(("total__gte", 0)),
                        name="order_total_non_negative",
                    ),
                ],
            },
        ),
        migrations.CreateModel(
            name="OrderItem",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("product_name_snapshot", models.CharField(max_length=200)),
                (
                    "variant_label_snapshot",
                    models.CharField(blank=True, default="", max_length=120),
                ),
                ("variant_attributes_snapshot", models.JSONField(blank=True, default=dict)),
                ("sku_snapshot", models.CharField(blank=True, default="", max_length=64)),
                ("unit_price", models.DecimalField(decimal_places=2, max_digits=12)),
                ("quantity", models.PositiveIntegerField()),
                ("line_total", models.DecimalField(decimal_places=2, max_digits=12)),
                (
                    "order",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="items",
                        to="orders.order",
                    ),
                ),
                (
                    "product",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="order_items",
                        to="catalog.product",
                    ),
                ),
                (
                    "product_variant",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="order_items",
                        to="catalog.productvariant",
                    ),
                ),
            ],
            options={
                "db_table": "orders_orderitem",
                "constraints": [
                    models.CheckConstraint(
                        condition=models.Q(("quantity__gte", 1)),
                        name="orderitem_quantity_positive",
                    ),
                    models.CheckConstraint(
                        condition=models.Q(("unit_price__gte", 0)),
                        name="orderitem_unit_price_non_negative",
                    ),
                    models.CheckConstraint(
                        condition=models.Q(("line_total__gte", 0)),
                        name="orderitem_line_total_non_negative",
                    ),
                ],
            },
        ),
    ]
