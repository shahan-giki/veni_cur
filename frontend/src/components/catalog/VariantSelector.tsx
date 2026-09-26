import type { PublicProductVariant } from "../../api/types/catalog";
import { variantOptionLabel } from "../../lib/variantDisplay";

type Props = {
  variants: PublicProductVariant[];
  selectedId: number | null;
  onSelect: (variant: PublicProductVariant) => void;
};

export function VariantSelector({ variants, selectedId, onSelect }: Props) {
  if (variants.length <= 1) return null;

  return (
    <div className="variant-selector">
      <fieldset>
        <legend>Choose an option</legend>
        <div className="variant-options" role="group" aria-label="Product variants">
          {variants.map((variant) => {
            const label = variantOptionLabel(variant);
            const pressed = variant.id === selectedId;
            return (
              <button
                key={variant.id}
                type="button"
                className="variant-option"
                aria-pressed={pressed}
                onClick={() => onSelect(variant)}
              >
                {label}
              </button>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
