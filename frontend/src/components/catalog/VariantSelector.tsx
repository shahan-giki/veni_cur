import type { PublicProductVariant } from "../../api/types/catalog";
import {
  extractColorSwatches,
  getVariantColor,
  pickVariantForColor,
  variantOptionLabel,
  variantsForColor,
} from "../../lib/variantDisplay";

type Props = {
  variants: PublicProductVariant[];
  selectedId: number | null;
  onSelect: (variant: PublicProductVariant) => void;
};

function optionFieldLabel(options: PublicProductVariant[]): string {
  const sizeLike = options.some((v) => {
    if (Object.keys(v.attributes).some((k) => /size/i.test(k))) return true;
    const label = v.label.trim();
    return /^(size\b|eu\b|uk\b|us\b)/i.test(label) || /^\d+(\.\d+)?$/.test(label);
  });
  return sizeLike ? "Size" : "Option";
}

/** Color dots + optional size/option select for multi-variant products. */
export function VariantSelector({ variants, selectedId, onSelect }: Props) {
  const colors = extractColorSwatches(variants);
  if (variants.length === 0) return null;
  if (variants.length <= 1 && colors.length === 0) return null;

  const selected = variants.find((v) => v.id === selectedId) ?? null;
  const selectedColor = getVariantColor(selected)?.name ?? null;
  const optionsForSelect =
    colors.length > 0 ? variantsForColor(variants, selectedColor) : variants;
  const showSelect = optionsForSelect.length > 1;
  const selectLabel = optionFieldLabel(optionsForSelect);
  const selectId = "pdp-variant-select";

  return (
    <div className="variant-selector">
      {colors.length > 0 ? (
        <div className="color-swatches">
          <p className="variant-selector__label" id="pdp-color-label">
            Color
            {selectedColor ? (
              <span className="color-swatches__name"> — {selectedColor}</span>
            ) : null}
          </p>
          <div
            className="color-swatches__row"
            role="radiogroup"
            aria-labelledby="pdp-color-label"
          >
            {colors.map((swatch) => {
              const pressed =
                selectedColor != null &&
                selectedColor.toLowerCase() === swatch.name.toLowerCase();
              return (
                <button
                  key={swatch.name}
                  type="button"
                  role="radio"
                  className={
                    pressed
                      ? "color-swatch color-swatch--selected"
                      : "color-swatch"
                  }
                  style={{ backgroundColor: swatch.hex }}
                  aria-checked={pressed}
                  aria-label={swatch.name}
                  title={swatch.name}
                  onClick={() => {
                    const next = pickVariantForColor(
                      variants,
                      swatch.name,
                      selectedId
                    );
                    if (next) onSelect(next);
                  }}
                />
              );
            })}
          </div>
        </div>
      ) : null}

      {showSelect ? (
        <>
          <label htmlFor={selectId} className="variant-selector__label">
            {selectLabel}
          </label>
          <select
            id={selectId}
            className="variant-selector__select"
            value={selectedId ?? ""}
            aria-label={selectLabel}
            onChange={(event) => {
              const id = Number.parseInt(event.target.value, 10);
              const next = optionsForSelect.find((v) => v.id === id);
              if (next) onSelect(next);
            }}
          >
            {optionsForSelect.map((variant) => (
              <option key={variant.id} value={variant.id}>
                {variantOptionLabel(variant)}
              </option>
            ))}
          </select>
        </>
      ) : null}
    </div>
  );
}
