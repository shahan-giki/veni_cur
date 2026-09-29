"""Send a one-off test message to verify SMTP / notification delivery."""

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Send a test email using the configured EMAIL_* settings."

    def add_arguments(self, parser):
        parser.add_argument("to", help="Recipient email address")
        parser.add_argument(
            "--subject",
            default="Veni SMTP test",
            help="Subject line (default: Veni SMTP test)",
        )

    def handle(self, *args, **options):
        to = options["to"].strip()
        if not to:
            raise CommandError("Recipient email is required.")

        backend = settings.EMAIL_BACKEND
        host = getattr(settings, "EMAIL_HOST", "") or "(none)"
        self.stdout.write(f"EMAIL_BACKEND={backend}")
        self.stdout.write(f"EMAIL_HOST={host}")
        self.stdout.write(f"FROM={settings.DEFAULT_FROM_EMAIL}")
        self.stdout.write(f"TO={to}")

        message = EmailMultiAlternatives(
            subject=options["subject"],
            body=(
                "This is a Veni SMTP test message.\n"
                "If you received this, order confirmation email delivery is configured.\n"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[to],
        )
        try:
            sent = message.send(fail_silently=False)
        except Exception as exc:
            raise CommandError(f"Send failed: {exc}") from exc

        if not sent:
            raise CommandError("Send returned 0 (no recipients accepted).")
        self.stdout.write(self.style.SUCCESS("Sent."))
