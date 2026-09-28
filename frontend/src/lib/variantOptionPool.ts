/**
 * Helpers for Admin variant option forms.
 * Option definitions are loaded from Postgres via `/admin/variant-options/`.
 * Values persist on ProductVariant.attributes (JSONB on Neon).
 */

export type OptionInputKind = "text" | "color";

export type VariantOptionDef = {
  key: string;
  label: string;
  kind: OptionInputKind;
  placeholder?: string;
  suggestions?: string[];
  /** From API when a category is selected. */
  recommended?: boolean;
  sort_order?: number;
  /** Legacy local shape — optional. */
  recommendedFor?: string[];
};

export type OptionSelection = {
  key: string;
  value: string;
  colorHex?: string;
};

const COLOR_ATTR_KEYS = new Set([
  "color",
  "color_hex",
  "Colour",
  "Color",
  "colour",
  "hex",
  "colour_hex",
]);

export function getOptionDef(
  key: string,
  pool: VariantOptionDef[]
): VariantOptionDef | undefined {
  return pool.find((o) => o.key === key);
}

export function suggestedOptionKeys(pool: VariantOptionDef[]): string[] {
  return pool.filter((o) => o.recommended).map((o) => o.key);
}

/** Default 2–3 options when opening the add-variant form. */
export function defaultSelectedKeys(pool: VariantOptionDef[]): string[] {
  const suggested = suggestedOptionKeys(pool);
  if (suggested.length > 0) return suggested.slice(0, 3);
  return pool.slice(0, 2).map((o) => o.key);
}

export function buildAttributesFromSelections(
  selections: OptionSelection[]
): Record<string, unknown> {
  const attrs: Record<string, unknown> = {};
  for (const sel of selections) {
    const value = sel.value.trim();
    if (!value) continue;
    if (sel.key === "color") {
      attrs.color = value;
      const hex = (sel.colorHex ?? "").trim();
      attrs.color_hex = /^#[0-9A-Fa-f]{6}$/.test(hex) ? hex.toLowerCase() : "#78716c";
    } else {
      attrs[sel.key] = value;
    }
  }
  return attrs;
}

export function labelFromSelections(
  selections: OptionSelection[],
  fallback = "Default"
): string {
  const parts = selections.map((s) => s.value.trim()).filter(Boolean);
  return parts.length ? parts.join(" · ") : fallback;
}

export function selectionsFromAttributes(
  attributes: Record<string, unknown> | null | undefined,
  pool: VariantOptionDef[],
  preferredKeys: string[] = []
): OptionSelection[] {
  const map = attributes ?? {};
  const keys = new Set<string>(preferredKeys);
  const poolKeys = new Set(pool.map((o) => o.key));

  for (const [rawKey, rawVal] of Object.entries(map)) {
    if (rawVal == null || String(rawVal).trim() === "") continue;
    if (rawKey === "color_hex" || rawKey === "hex" || rawKey === "colour_hex") continue;
    if (COLOR_ATTR_KEYS.has(rawKey)) {
      keys.add("color");
      continue;
    }
    if (poolKeys.has(rawKey)) keys.add(rawKey);
  }
  if (map.color || map.Colour || map.Color || map.colour) keys.add("color");

  const out: OptionSelection[] = [];
  for (const key of keys) {
    const def = getOptionDef(key, pool);
    if (!def && key !== "color") continue;
    if ((def?.kind ?? (key === "color" ? "color" : "text")) === "color") {
      const name = String(map.color ?? map.Colour ?? map.Color ?? map.colour ?? "").trim();
      const hex = String(map.color_hex ?? map.hex ?? map.colour_hex ?? "#78716c").trim();
      out.push({ key: "color", value: name, colorHex: hex || "#78716c" });
    } else {
      out.push({ key, value: String(map[key] ?? "").trim() });
    }
  }
  return out;
}

export function poolOptionsNotYetSelected(
  pool: VariantOptionDef[],
  selectedKeys: string[]
): VariantOptionDef[] {
  const taken = new Set(selectedKeys);
  return pool.filter((o) => !taken.has(o.key));
}

export function emptySelectionsForKeys(
  keys: string[],
  pool: VariantOptionDef[]
): OptionSelection[] {
  return keys.map((key) => {
    const def = getOptionDef(key, pool);
    if (def?.kind === "color" || key === "color") {
      return { key, value: "", colorHex: "#8b7355" };
    }
    return { key, value: "" };
  });
}
