import type { PublicProductVariant } from "../api/types/catalog";

export function formatVariantDetail(
  label: string | null | undefined,
  attributes: Record<string, unknown> | null | undefined,
  fallback = "Standard"
): string {
  const trimmed = label?.trim() ?? "";
  if (trimmed) return trimmed;
  const parts = Object.entries(attributes ?? {})
    .filter(([, v]) => v != null && String(v).trim() !== "")
    .map(([k, v]) => `${k}: ${String(v)}`);
  return parts.length ? parts.join(" · ") : fallback;
}

export function variantOptionLabel(variant: PublicProductVariant): string {
  const trimmed = variant.label.trim();
  if (trimmed) return trimmed;
  const parts = Object.entries(variant.attributes)
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

/** Well-known fashion neutrals when admin sets a name without hex. */
const NAMED_COLOR_HEX: Record<string, string> = {
  black: "#1c1917",
  white: "#fafaf9",
  ivory: "#fffff0",
  cream: "#f5f0e6",
  beige: "#d4c4a8",
  taupe: "#8b7355",
  brown: "#6b4423",
  grey: "#78716c",
  gray: "#78716c",
  charcoal: "#44403c",
  navy: "#1e3a5f",
  blue: "#1d4ed8",
  red: "#b91c1c",
  maroon: "#7f1d1d",
  pink: "#db2777",
  green: "#166534",
  olive: "#556b2f",
  gold: "#a16207",
};

export type VariantColor = {
  name: string;
  hex: string;
};

export type ColorSwatchOption = VariantColor & {
  /** Representative variant id for this color (first match). */
  variantId: number;
};

export function normalizeHex(raw: string): string | null {
  const value = raw.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(value)) return value.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(value)) {
    const chars = value.slice(1);
    return `#${chars[0]}${chars[0]}${chars[1]}${chars[1]}${chars[2]}${chars[2]}`.toLowerCase();
  }
  if (/^[0-9a-fA-F]{6}$/.test(value)) return `#${value.toLowerCase()}`;
  return null;
}

const COLOR_ATTR_KEYS = [
  "color",
  "color_hex",
  "Colour",
  "Color",
  "colour",
  "hex",
  "colour_hex",
] as const;

/** Merge color into existing variant attributes without dropping size/volume keys. */
export function mergeColorAttributes(
  existing: Record<string, unknown>,
  colorName: string,
  colorHexRaw: string
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...existing };
  for (const key of COLOR_ATTR_KEYS) {
    delete next[key];
  }
  const color = colorName.trim();
  if (!color) return next;
  next.color = color;
  next.color_hex = normalizeHex(colorHexRaw) ?? "#78716c";
  return next;
}

/** Read color name + hex from a raw attributes map (`color` / `color_hex`). */
export function getColorFromAttributes(
  attrs: Record<string, unknown> | null | undefined
): VariantColor | null {
  const map = attrs ?? {};
  const nameRaw =
    map.color ?? map.Colour ?? map.Color ?? map.colour ?? null;
  const name = nameRaw != null ? String(nameRaw).trim() : "";
  if (!name) return null;

  const hexRaw = map.color_hex ?? map.hex ?? map.colour_hex ?? null;
  const fromAttr = hexRaw != null ? normalizeHex(String(hexRaw)) : null;
  const fromName = NAMED_COLOR_HEX[name.toLowerCase()] ?? null;
  const hex = fromAttr ?? fromName ?? "#78716c";

  return { name, hex };
}

/** Read color name + hex from variant attributes (`color` / `color_hex`). */
export function getVariantColor(
  variant: PublicProductVariant | null | undefined
): VariantColor | null {
  if (!variant) return null;
  return getColorFromAttributes(variant.attributes);
}

/** Unique colors across variants, preserving first-seen order. */
export function extractColorSwatches(
  variants: PublicProductVariant[]
): ColorSwatchOption[] {
  const seen = new Map<string, ColorSwatchOption>();
  for (const variant of variants) {
    const color = getVariantColor(variant);
    if (!color) continue;
    const key = color.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.set(key, { ...color, variantId: variant.id });
  }
  return [...seen.values()];
}

export function variantsForColor(
  variants: PublicProductVariant[],
  colorName: string | null
): PublicProductVariant[] {
  if (!colorName) return variants;
  const key = colorName.toLowerCase();
  return variants.filter((v) => getVariantColor(v)?.name.toLowerCase() === key);
}

export function pickVariantForColor(
  variants: PublicProductVariant[],
  colorName: string,
  preferredId: number | null
): PublicProductVariant | null {
  const matches = variantsForColor(variants, colorName);
  if (matches.length === 0) return null;
  if (preferredId != null) {
    const keep = matches.find((v) => v.id === preferredId);
    if (keep) return keep;
  }
  return matches[0] ?? null;
}
