from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("orders", "0001_initial"),
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
                ],
                default="PENDING_PAYMENT",
                max_length=32,
            ),
        ),
    ]
