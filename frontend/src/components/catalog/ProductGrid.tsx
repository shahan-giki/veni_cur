import type { PublicProductListItem } from "../../api/types/catalog";
import { ProductCard } from "./ProductCard";

type Props = {
  products: PublicProductListItem[];
};

export function ProductGrid({ products }: Props) {
  return (
    <ul className="product-grid" style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {products.map((product) => (
        <li key={product.id}>
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}
