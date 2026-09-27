import { useEffect, useMemo, useRef, useState } from "react";
import type { PublicProductDetail } from "../../api/types/catalog";

type Image = PublicProductDetail["images"][number];

type Props = {
  images: Image[];
  productName: string;
};

/** Tall swipeable product images with dot pagination. No thumbnail strip. */
export function ProductGallery({ images, productName }: Props) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);

  const slides = useMemo(
    () =>
      [...images]
        .filter((img) => Boolean(img.url))
        .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id),
    [images]
  );

  useEffect(() => {
    const track = trackRef.current;
    if (!track || slides.length <= 1) return;

    function onScroll() {
      if (!track) return;
      const width = track.clientWidth;
      if (width <= 0) return;
      setActive(Math.round(track.scrollLeft / width));
    }

    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, [slides.length]);

  function goTo(index: number) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: index * track.clientWidth, behavior: "smooth" });
  }

  return (
    <div
      className="gallery"
      role="region"
      aria-roledescription="carousel"
      aria-label={`${productName} images`}
    >
      <ul ref={trackRef} className="gallery__track">
        {slides.length === 0 ? (
          <li className="gallery__slide gallery__slide--empty">
            <span className="product-card__placeholder">No image available</span>
          </li>
        ) : (
          slides.map((img, index) => {
            const alt = img.alt_text?.trim() || `${productName} view ${index + 1}`;
            return (
              <li key={img.id} className="gallery__slide">
                <img src={img.url!} alt={alt} draggable={false} />
              </li>
            );
          })
        )}
      </ul>
      {slides.length > 1 ? (
        <div className="gallery__dots" role="tablist" aria-label="Product images">
          {slides.map((img, index) => (
            <button
              key={img.id}
              type="button"
              role="tab"
              className={
                index === active ? "gallery__dot gallery__dot--active" : "gallery__dot"
              }
              aria-label={`Show image ${index + 1} of ${slides.length}`}
              aria-selected={index === active}
              onClick={() => goTo(index)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
