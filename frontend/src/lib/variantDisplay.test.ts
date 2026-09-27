import { describe, expect, it } from "vitest";
import type { PublicProductVariant } from "../api/types/catalog";
import {
  extractColorSwatches,
  getColorFromAttributes,
  getVariantColor,
  mergeColorAttributes,
  pickVariantForColor,
} from "./variantDisplay";

function variant(
  partial: Partial<PublicProductVariant> & Pick<PublicProductVariant, "id">
): PublicProductVariant {
  return {
    sku: `sku-${partial.id}`,
    label: "",
    effective_price: "100.00",
    inventory_count: 5,
    attributes: {},
    is_default: false,
    ...partial,
  };
}

describe("variant color helpers", () => {
  it("reads color name and hex from attributes", () => {
    expect(
      getVariantColor(
        variant({
          id: 1,
          attributes: { color: "Taupe", color_hex: "#8B7355" },
        })
      )
    ).toEqual({ name: "Taupe", hex: "#8b7355" });
  });

  it("falls back to named hex when color_hex is missing", () => {
    expect(
      getVariantColor(variant({ id: 2, attributes: { color: "Navy" } }))
    ).toEqual({ name: "Navy", hex: "#1e3a5f" });
  });

  it("extracts unique color swatches in order", () => {
    const swatches = extractColorSwatches([
      variant({ id: 1, attributes: { color: "Taupe", color_hex: "#8b7355" } }),
      variant({ id: 2, attributes: { color: "Navy", color_hex: "#1e3a5f" } }),
      variant({ id: 3, attributes: { color: "Taupe", color_hex: "#8b7355" } }),
    ]);
    expect(swatches).toHaveLength(2);
    expect(swatches[0]).toMatchObject({ name: "Taupe", variantId: 1 });
    expect(swatches[1]).toMatchObject({ name: "Navy", variantId: 2 });
  });

  it("picks a matching variant when switching color", () => {
    const variants = [
      variant({ id: 1, attributes: { color: "Taupe", size: "M" } }),
      variant({ id: 2, attributes: { color: "Navy", size: "M" } }),
      variant({ id: 3, attributes: { color: "Navy", size: "L" } }),
    ];
    expect(pickVariantForColor(variants, "Navy", 1)?.id).toBe(2);
    expect(pickVariantForColor(variants, "Navy", 3)?.id).toBe(3);
  });

  it("reads color aliases the same way storefront and admin do", () => {
    expect(
      getColorFromAttributes({ Colour: "Taupe", hex: "#8B7355" })
    ).toEqual({ name: "Taupe", hex: "#8b7355" });
  });

  it("merges color into attributes without dropping other keys", () => {
    expect(
      mergeColorAttributes({ size: "M", color: "Old" }, "Navy", "1e3a5f")
    ).toEqual({ size: "M", color: "Navy", color_hex: "#1e3a5f" });
    expect(mergeColorAttributes({ size: "L", color: "Navy" }, "", "")).toEqual({
      size: "L",
    });
  });
});
