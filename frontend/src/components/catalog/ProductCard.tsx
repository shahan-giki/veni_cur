import { useState } from "react";
import { Link } from "react-router-dom";
import { formatApiValidationError } from "../../api/client";
import type { PublicProductListItem } from "../../api/types/catalog";
import { useCartMutations } from "../../hooks/useCart";
import { formatPrice } from "../../lib/formatPrice";

type Props = {
  product: PublicProductListItem;
};

function BagIcon() {
  return (
    <svg
      className="product-card__action-icon"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 8h12l-1 12H7L6 8z" />
      <path d="M9 8V7a3 3 0 0 1 6 0v1" />
    </svg>
  );
}

function CartPlusIcon() {
  return (
    <svg
      className="product-card__action-icon"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="9" cy="20" r="1.25" />
      <circle cx="17" cy="20" r="1.25" />
      <path d="M3 4h2l2.2 10.2a1.5 1.5 0 0 0 1.5 1.2H17a1.5 1.5 0 0 0 1.45-1.1L20 8H7" />
      <path d="M12 8v5M9.5 10.5h5" />
    </svg>
  );
}

export function ProductCard({ product }: Props) {
  const { addItem } = useCartMutations();
  const [status, setStatus] = useState<string | null>(null);
  const href = `/products/${product.slug}`;
  const canAdd = product.default_variant_id != null;

  async function onAddToCart() {
    if (product.default_variant_id == null) return;
    setStatus(null);
    try {
      await addItem.mutateAsync({ variantId: product.default_variant_id, quantity: 1 });
      setStatus("Added to cart");
    } catch (err) {
      setStatus(formatApiValidationError(err));
    }
  }

  return (
    <article className="product-card">
      <div className="product-card__media">
        <Link to={href} className="product-card__media-link" aria-label={product.name}>
          {product.primary_image_url ? (
            <img src={product.primary_image_url} alt="" loading="lazy" />
          ) : (
            <span className="product-card__placeholder">No image</span>
          )}
        </Link>
        <div className="product-card__overlay">
          <Link
            to={href}
            className="product-card__action product-card__action--ghost"
            aria-label="Buy now"
          >
            <BagIcon />
            <span className="product-card__action-label">Buy now</span>
          </Link>
          <button
            type="button"
            className="product-card__action product-card__action--solid"
            aria-label={addItem.isPending ? "Adding to cart" : "Add to cart"}
            disabled={!canAdd || addItem.isPending}
            onClick={() => void onAddToCart()}
          >
            <CartPlusIcon />
            <span className="product-card__action-label">
              {addItem.isPending ? "Adding…" : "Add to cart"}
            </span>
          </button>
        </div>
      </div>
      <div className="product-card__body">
        <h3 className="product-card__name">
          <Link to={href}>{product.name}</Link>
        </h3>
        <span className="product-card__price">
          {product.price_varies
            ? `from ${formatPrice(product.effective_price)}`
            : formatPrice(product.effective_price)}
        </span>
        {status ? (
          <p className="product-card__status" role="status">
            {status}
          </p>
        ) : null}
      </div>
    </article>
  );
}
