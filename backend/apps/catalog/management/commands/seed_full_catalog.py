from django.core.management.base import BaseCommand

from apps.catalog.services.catalog_seed_service import seed_full_catalog


class Command(BaseCommand):
    help = (
        "Seed realistic sample products and variants for all five Veni categories "
        "(idempotent; PUBLISHED + active)."
    )

    def handle(self, *args, **options):
        summary = seed_full_catalog()
        totals = summary.pop("_totals")

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("Full catalog seed complete"))
        self.stdout.write("-" * 56)
        for slug, row in summary.items():
            self.stdout.write(
                f"{row['name']} ({slug}): "
                f"products +{row['products_created']}/~{row['products_updated']}, "
                f"variants +{row['variants_created']}/~{row['variants_updated']}"
            )
        self.stdout.write("-" * 56)
        self.stdout.write(
            self.style.SUCCESS(
                "Totals — "
                f"products created={totals['products_created']} "
                f"updated={totals['products_updated']}; "
                f"variants created={totals['variants_created']} "
                f"updated={totals['variants_updated']}"
            )
        )
