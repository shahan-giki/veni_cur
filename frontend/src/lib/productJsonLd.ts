import type { PublicProductDetail, PublicProductVariant } from "../api/types/catalog";

export type ProductJsonLd = {
  "@context": "https://schema.org";
  "@type": "Product";
  name: string;
  url: string;
  description?: string;
  sku?: string;
  image?: string[];
  offers: {
    "@type": "Offer";
    url: string;
    priceCurrency: "PKR";
    price: string;
    availability: "https://schema.org/InStock" | "https://schema.org/OutOfStock";
    sku?: string;
    itemCondition: "https://schema.org/NewCondition";
  };
};

type BuildArgs = {
  product: PublicProductDetail;
  variant: PublicProductVariant | null;
  pageUrl: string;
};

/** Schema.org Product + Offer for PDP SEO (client-injected JSON-LD). */
export function buildProductJsonLd({
  product,
  variant,
  pageUrl,
}: BuildArgs): ProductJsonLd {
  const price = variant?.effective_price ?? product.effective_price;
  const inventory = variant?.inventory_count ?? 0;
  const sku = variant?.sku?.trim() || undefined;
  const images = product.images
    .map((img) => img.url)
    .filter((url): url is string => Boolean(url));
  const description = product.description.trim() || undefined;

  const ld: ProductJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    url: pageUrl,
    offers: {
      "@type": "Offer",
      url: pageUrl,
      priceCurrency: "PKR",
      price,
      availability:
        inventory > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  if (description) ld.description = description;
  if (sku) {
    ld.sku = sku;
    ld.offers.sku = sku;
  }
  if (images.length > 0) ld.image = images;

  return ld;
}
