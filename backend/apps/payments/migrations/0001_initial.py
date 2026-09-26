import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("orders", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Payment",
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
                        choices=[
                            ("AWAITING_PROOF", "Awaiting proof"),
                            ("PENDING_REVIEW", "Pending review"),
                            ("VERIFIED", "Verified"),
                            ("REJECTED", "Rejected"),
                        ],
                        default="AWAITING_PROOF",
                        max_length=32,
                    ),
                ),
                (
                    "latest_proof_s3_key",
                    models.CharField(blank=True, default="", max_length=512),
                ),
                ("rejection_note", models.TextField(blank=True, default="")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "order",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="payment",
                        to="orders.order",
                    ),
                ),
            ],
            options={
                "db_table": "payments_payment",
            },
        ),
        migrations.CreateModel(
            name="PaymentProof",
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
                ("s3_key", models.CharField(max_length=512)),
                ("content_type", models.CharField(blank=True, default="", max_length=128)),
                ("uploaded_at", models.DateTimeField(auto_now_add=True)),
                (
                    "payment",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="proofs",
                        to="payments.payment",
                    ),
                ),
            ],
            options={
                "db_table": "payments_paymentproof",
                "ordering": ["-uploaded_at"],
            },
        ),
    ]
