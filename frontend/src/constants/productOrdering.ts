/** Ordering values accepted by GET /api/v1/products/ */
export const PRODUCT_ORDERING_OPTIONS = [
  { value: "name", label: "Name (A–Z)" },
  { value: "-name", label: "Name (Z–A)" },
  { value: "-created_at", label: "Newest" },
  { value: "created_at", label: "Oldest" },
  { value: "base_price", label: "Price (low to high)" },
  { value: "-base_price", label: "Price (high to low)" },
] as const;

export type ProductOrdering = (typeof PRODUCT_ORDERING_OPTIONS)[number]["value"];

export function isProductOrdering(value: string): value is ProductOrdering {
  return PRODUCT_ORDERING_OPTIONS.some((o) => o.value === value);
}
