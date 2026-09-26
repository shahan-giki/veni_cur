import { useState, type KeyboardEvent } from "react";
import type { PublicProductDetail } from "../../api/types/catalog";

type Image = PublicProductDetail["images"][number];

type Props = {
  images: Image[];
  productName: string;
};

export function ProductGallery({ images, productName }: Props) {
  const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
  const withUrl = sorted.filter((img) => img.url);
  const [selectedId, setSelectedId] = useState(withUrl[0]?.id ?? sorted[0]?.id ?? null);

  const selected =
    withUrl.find((img) => img.id === selectedId) ?? withUrl[0] ?? sorted[0] ?? null;

  function onThumbKeyDown(e: KeyboardEvent, index: number) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const next =
      e.key === "ArrowRight"
        ? Math.min(index + 1, withUrl.length - 1)
        : Math.max(index - 1, 0);
    const target = withUrl[next];
    if (target) setSelectedId(target.id);
  }

  if (!selected) {
    return (
      <div className="gallery">
        <div className="gallery__main">
          <span className="product-card__placeholder">No image available</span>
        </div>
      </div>
    );
  }

  const alt = selected.alt_text?.trim() || productName;

  return (
    <div className="gallery">
      <div className="gallery__main">
        {selected.url ? (
          <img src={selected.url} alt={alt} />
        ) : (
          <span className="product-card__placeholder">Image unavailable</span>
        )}
      </div>
      {withUrl.length > 1 ? (
        <div className="gallery__thumbs" role="tablist" aria-label="Product images">
          {withUrl.map((img, index) => {
            const thumbAlt = img.alt_text?.trim() || `${productName} view ${index + 1}`;
            return (
              <button
                key={img.id}
                type="button"
                role="tab"
                className="gallery__thumb"
                aria-current={img.id === selected.id ? "true" : undefined}
                aria-label={thumbAlt}
                onClick={() => setSelectedId(img.id)}
                onKeyDown={(e) => onThumbKeyDown(e, index)}
              >
                <img src={img.url!} alt="" />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
