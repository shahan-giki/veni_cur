from django.contrib import admin

from apps.catalog.models import Category, Product, ProductImage, ProductVariant


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 1
    fields = (
        "sku",
        "label",
        "inventory_count",
        "attributes",
        "is_default",
        "is_active",
    )
    verbose_name_plural = (
        "Variants (set attributes e.g. "
        '{"color": "Taupe", "color_hex": "#8b7355"} for storefront color dots)'
    )


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 0


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "parent", "sort_order", "is_active", "is_visible")
    list_filter = ("is_active", "is_visible")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "category", "status", "is_active", "base_price")
    list_filter = ("status", "is_active", "category")
    prepopulated_fields = {"slug": ("name",)}
    inlines = [ProductVariantInline, ProductImageInline]


@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = (
        "sku",
        "product",
        "label",
        "color_display",
        "inventory_count",
        "is_active",
        "is_default",
    )
    list_filter = ("is_active",)
    fields = (
        "product",
        "sku",
        "label",
        "price",
        "inventory_count",
        "attributes",
        "is_default",
        "is_active",
    )

    @admin.display(description="Color")
    def color_display(self, obj: ProductVariant) -> str:
        attrs = obj.attributes or {}
        name = attrs.get("color")
        hex_code = attrs.get("color_hex")
        if name and hex_code:
            return f"{name} ({hex_code})"
        if name:
            return str(name)
        return "—"


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ("product", "sort_order", "s3_key", "alt_text")
