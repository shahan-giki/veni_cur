import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def backfill_access_tokens(apps, schema_editor):
    """One UUID per existing row: AddField would stamp the same value on all of them."""
    Order = apps.get_model("orders", "Order")
    for pk in Order.objects.filter(access_token__isnull=True).values_list("pk", flat=True):
        Order.objects.filter(pk=pk).update(access_token=uuid.uuid4())


def backfill_contact_from_customer(apps, schema_editor):
    """Existing Orders predate contact capture; seed the email we do know."""
    Order = apps.get_model("orders", "Order")
    for order in Order.objects.filter(contact_email="").select_related("customer"):
        if order.customer_id is None:
            continue
        Order.objects.filter(pk=order.pk).update(
            contact_email=order.customer.email,
            contact_name=f"{order.customer.first_name} {order.customer.last_name}".strip(),
        )


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        (
            "orders",
            "0004_rename_orders_order_customer_created_idx_orders_orde_custome_413d7d_idx",
        ),
    ]

    operations = [
        migrations.AlterField(
            model_name="order",
            name="customer",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="orders",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="order",
            name="access_token",
            field=models.UUIDField(editable=False, null=True),
        ),
        migrations.RunPython(backfill_access_tokens, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="order",
            name="access_token",
            field=models.UUIDField(default=uuid.uuid4, editable=False, unique=True),
        ),
        migrations.AddField(
            model_name="order",
            name="contact_name",
            field=models.CharField(default="", max_length=120),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="order",
            name="contact_phone",
            field=models.CharField(default="", max_length=32),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="order",
            name="contact_email",
            field=models.EmailField(default="", max_length=254),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="order",
            name="shipping_address",
            field=models.TextField(default=""),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="order",
            name="shipping_city",
            field=models.CharField(default="", max_length=120),
            preserve_default=False,
        ),
        migrations.RunPython(backfill_contact_from_customer, migrations.RunPython.noop),
    ]
