from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("orders", "0002_order_status_lifecycle"),
    ]

    operations = [
        migrations.AlterField(
            model_name="order",
            name="status",
            field=models.CharField(
                choices=[
                    ("PENDING_PAYMENT", "Pending payment"),
                    ("PAYMENT_VERIFICATION", "Payment verification"),
                    ("PROCESSING", "Processing"),
                    ("SHIPPED", "Shipped"),
                    ("CANCELLED", "Cancelled"),
                ],
                default="PENDING_PAYMENT",
                max_length=32,
            ),
        ),
    ]
