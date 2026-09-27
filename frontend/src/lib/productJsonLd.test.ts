import { describe, expect, it } from "vitest";
import type { PublicProductDetail, PublicProductVariant } from "../api/types/catalog";
import { buildProductJsonLd } from "./productJsonLd";

const variant: PublicProductVariant = {
  id: 10,
  sku: "SKU-A",
  label: "50ml",
  effective_price: "500.00",
  inventory_count: 12,
  attributes: { volume: "50ml" },
  is_default: true,
};

const product: PublicProductDetail = {
  id: 1,
  name: "Sample Serum",
  slug: "sample-serum",
  category_slug: "skincare",
  description: "A short description for shoppers.",
  effective_price: "500.00",
  price_varies: false,
  default_variant_id: 10,
  primary_image_url: "https://cdn.example/a.jpg",
  images: [
    { id: 1, alt_text: "Front", sort_order: 0, url: "https://cdn.example/a.jpg" },
    { id: 2, alt_text: "Back", sort_order: 1, url: "https://cdn.example/b.jpg" },
  ],
  variants: [variant],
};

describe("buildProductJsonLd", () => {
  it("emits schema.org Product with PKR offer and InStock when inventory remains", () => {
    const ld = buildProductJsonLd({
      product,
      variant,
      pageUrl: "https://veni.store/products/sample-serum",
    });

    expect(ld["@context"]).toBe("https://schema.org");
    expect(ld["@type"]).toBe("Product");
    expect(ld.name).toBe("Sample Serum");
    expect(ld.description).toBe("A short description for shoppers.");
    expect(ld.sku).toBe("SKU-A");
    expect(ld.image).toEqual([
      "https://cdn.example/a.jpg",
      "https://cdn.example/b.jpg",
    ]);
    expect(ld.url).toBe("https://veni.store/products/sample-serum");
    expect(ld.offers).toEqual({
      "@type": "Offer",
      url: "https://veni.store/products/sample-serum",
      priceCurrency: "PKR",
      price: "500.00",
      availability: "https://schema.org/InStock",
      sku: "SKU-A",
      itemCondition: "https://schema.org/NewCondition",
    });
  });

  it("marks OutOfStock when selected variant has no inventory", () => {
    const ld = buildProductJsonLd({
      product,
      variant: { ...variant, inventory_count: 0 },
      pageUrl: "https://veni.store/products/sample-serum",
    });
    expect(ld.offers.availability).toBe("https://schema.org/OutOfStock");
  });

  it("omits empty description and falls back to product effective price without a variant", () => {
    const ld = buildProductJsonLd({
      product: { ...product, description: "", images: [], primary_image_url: null },
      variant: null,
      pageUrl: "https://veni.store/products/sample-serum",
    });
    expect(ld.description).toBeUndefined();
    expect(ld.sku).toBeUndefined();
    expect(ld.image).toBeUndefined();
    expect(ld.offers.price).toBe("500.00");
    expect(ld.offers.availability).toBe("https://schema.org/OutOfStock");
  });
});
