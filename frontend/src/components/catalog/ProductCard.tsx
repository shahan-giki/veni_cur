import { Link } from "react-router-dom";
import type { PublicProductListItem } from "../../api/types/catalog";
import { formatPrice } from "../../lib/formatPrice";

type Props = {
  product: PublicProductListItem;
};

export function ProductCard({ product }: Props) {
  return (
    <Link to={`/products/${product.slug}`} className="product-card">
      <div className="product-card__media">
        {product.primary_image_url ? (
          <img src={product.primary_image_url} alt={product.name} loading="lazy" />
        ) : (
          <span className="product-card__placeholder">No image</span>
        )}
      </div>
      <div className="product-card__body">
        <h3 className="product-card__name">{product.name}</h3>
        <span className="product-card__price">{formatPrice(product.effective_price)}</span>
      </div>
    </Link>
  );
}
