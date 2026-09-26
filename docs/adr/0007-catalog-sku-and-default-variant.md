# Catalog SKU ownership and default variant

Status: accepted

**SKU authority:** The **ProductVariant.sku** is the canonical purchasable SKU (unique globally). **Product.sku** is an optional catalog reference only (e.g. legacy or display); it is not used for cart or inventory. All stock and checkout lines (Phase 5+) will reference variants.

**Default variant:** When an admin creates a product without additional variants, `product_service.create_product` creates one **Default** variant (`is_default=True`) so inventory and pricing rules stay variant-centric (ADR-0002). Additional variants are created explicitly via the admin variant API.

**Consequences:** Public search matches product name, description, product.sku, and any variant SKU. Customers never receive inactive variants on product detail.
