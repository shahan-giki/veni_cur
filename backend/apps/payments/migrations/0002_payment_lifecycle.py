import django.db.models.deletion
from decimal import Decimal

from django.db import migrations, models
from django.db.models import Q


def forwards_migrate_payments(apps, schema_editor):
    Payment = apps.get_model("payments", "Payment")
    Order = apps.get_model("orders", "Order")
    for payment in list(Payment.objects.select_related("order").all()):
        order = payment.order
        payment.amount = order.total
        if payment.status == "AWAITING_PROOF":
            if not payment.proof_s3_key:
                payment.delete()
                continue
            payment.status = "PENDING"
            Order.objects.filter(pk=order.pk).update(status="PAYMENT_VERIFICATION")
        elif payment.status == "PENDING_REVIEW":
            payment.status = "PENDING"
            Order.objects.filter(pk=order.pk).update(status="PAYMENT_VERIFICATION")
        elif payment.status == "VERIFIED":
            Order.objects.filter(pk=order.pk).update(status="PROCESSING")
        elif payment.status == "REJECTED":
            Order.objects.filter(pk=order.pk).update(status="PENDING_PAYMENT")
        payment.save(update_fields=["amount", "status"])


class Migration(migrations.Migration):

    dependencies = [
        ("orders", "0002_order_status_lifecycle"),
        ("payments", "0001_initial"),
    ]

    operations = [
        migrations.DeleteModel(
            name="PaymentProof",
        ),
        migrations.RenameField(
            model_name="payment",
            old_name="latest_proof_s3_key",
            new_name="proof_s3_key",
        ),
        migrations.RenameField(
            model_name="payment",
            old_name="rejection_note",
            new_name="rejection_reason",
        ),
        migrations.AddField(
            model_name="payment",
            name="amount",
            field=models.DecimalField(
                decimal_places=2, default=Decimal("0"), max_digits=12
            ),
        ),
        migrations.AddField(
            model_name="payment",
            name="reference_number",
            field=models.CharField(blank=True, default="", max_length=64),
        ),
        migrations.AlterField(
            model_name="payment",
            name="order",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="payments",
                to="orders.order",
            ),
        ),
        migrations.RunPython(forwards_migrate_payments, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="payment",
            name="proof_s3_key",
            field=models.CharField(max_length=512),
        ),
        migrations.AlterField(
            model_name="payment",
            name="status",
            field=models.CharField(
                choices=[
                    ("PENDING", "Pending"),
                    ("VERIFIED", "Verified"),
                    ("REJECTED", "Rejected"),
                ],
                default="PENDING",
                max_length=32,
            ),
        ),
        migrations.AddConstraint(
            model_name="payment",
            constraint=models.UniqueConstraint(
                condition=Q(status__in=["PENDING", "VERIFIED"]),
                fields=("order",),
                name="payments_one_active_per_order",
            ),
        ),
    ]
