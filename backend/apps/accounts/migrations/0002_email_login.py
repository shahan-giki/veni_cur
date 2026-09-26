import django.utils.timezone
from django.db import migrations, models


def copy_username_to_email(apps, schema_editor):
    User = apps.get_model("accounts", "User")
    for user in User.objects.all():
        if not user.email:
            user.email = f"{user.username}@migrated.veni.local"
            user.save(update_fields=["email"])


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="updated_at",
            field=models.DateTimeField(auto_now=True, default=django.utils.timezone.now),
            preserve_default=False,
        ),
        migrations.RunPython(copy_username_to_email, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="user",
            name="email",
            field=models.EmailField(max_length=254, unique=True),
        ),
        migrations.RemoveField(
            model_name="user",
            name="username",
        ),
    ]
