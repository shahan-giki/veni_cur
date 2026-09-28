import { describe, expect, it } from "vitest";
import {
  buildAttributesFromSelections,
  defaultSelectedKeys,
  labelFromSelections,
  selectionsFromAttributes,
  suggestedOptionKeys,
  type VariantOptionDef,
} from "./variantOptionPool";

const samplePool: VariantOptionDef[] = [
  {
    key: "volume",
    label: "Volume",
    kind: "text",
    recommended: true,
    sort_order: 1,
  },
  {
    key: "skin_type",
    label: "Skin type",
    kind: "text",
    recommended: true,
    sort_order: 2,
  },
  {
    key: "color",
    label: "Color",
    kind: "color",
    recommended: false,
    sort_order: 3,
  },
  {
    key: "material",
    label: "Material",
    kind: "text",
    recommended: false,
    sort_order: 4,
  },
];

describe("variantOptionPool", () => {
  it("uses recommended flags from the DB-backed pool", () => {
    expect(suggestedOptionKeys(samplePool)).toEqual(["volume", "skin_type"]);
    expect(defaultSelectedKeys(samplePool)).toEqual(["volume", "skin_type"]);
  });

  it("builds attributes including color hex from selections", () => {
    expect(
      buildAttributesFromSelections([
        { key: "color", value: "Taupe", colorHex: "#8b7355" },
        { key: "volume", value: "30ml" },
        { key: "size", value: "  " },
      ])
    ).toEqual({
      color: "Taupe",
      color_hex: "#8b7355",
      volume: "30ml",
    });
  });

  it("builds a customer-facing label from filled values", () => {
    expect(
      labelFromSelections([
        { key: "color", value: "Navy" },
        { key: "size", value: "M" },
      ])
    ).toBe("Navy · M");
  });

  it("round-trips attributes into editable selections", () => {
    const selections = selectionsFromAttributes(
      { color: "Olive", color_hex: "#556b2f", material: "Pashmina" },
      samplePool
    );
    expect(selections).toEqual(
      expect.arrayContaining([
        { key: "color", value: "Olive", colorHex: "#556b2f" },
        { key: "material", value: "Pashmina" },
      ])
    );
  });
});
