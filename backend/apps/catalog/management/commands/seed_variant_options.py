from django.core.management.base import BaseCommand

from apps.catalog.services.option_pool_service import seed_variant_options


class Command(BaseCommand):
    help = "Seed variant option pool definitions and category recommendations (idempotent)."

    def handle(self, *args, **options):
        result = seed_variant_options()
        self.stdout.write(
            self.style.SUCCESS(
                "Variant options: "
                f"created={result['created']} updated={result['updated']} "
                f"links_created={result['links_created']}"
            )
        )
