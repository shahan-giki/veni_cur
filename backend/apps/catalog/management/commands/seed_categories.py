from django.core.management.base import BaseCommand

from apps.catalog.models import Category

INITIAL_CATEGORIES = [
    ("Skincare", "skincare", 10),
    ("Oral Care", "oral-care", 20),
    ("Perfumes / Fragrances", "perfumes-fragrances", 30),
    ("Shawls", "shawls", 40),
    ("Peshawari Chappals", "peshawari-chappals", 50),
]


class Command(BaseCommand):
    help = "Seed initial Veni categories (idempotent)."

    def handle(self, *args, **options):
        for name, slug, sort_order in INITIAL_CATEGORIES:
            Category.objects.update_or_create(
                slug=slug,
                defaults={
                    "name": name,
                    "sort_order": sort_order,
                    "is_active": True,
                    "is_visible": True,
                },
            )
        self.stdout.write(
            self.style.SUCCESS(f"Seeded {len(INITIAL_CATEGORIES)} categories.")
        )
