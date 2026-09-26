import type { PublicProductVariant } from "../api/types/catalog";

export function variantOptionLabel(variant: PublicProductVariant): string {
  if (variant.label.trim()) return variant.label.trim();
  const attrs = variant.attributes;
  const parts = Object.entries(attrs)
    .filter(([, v]) => v != null && String(v).trim() !== "")
    .map(([k, v]) => `${formatAttributeKey(k)}: ${String(v)}`);
  return parts.length > 0 ? parts.join(" · ") : `Option ${variant.id}`;
}

function formatAttributeKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function pickDefaultVariant(
  variants: PublicProductVariant[]
): PublicProductVariant | null {
  if (variants.length === 0) return null;
  return variants.find((v) => v.is_default) ?? variants[0] ?? null;
}
