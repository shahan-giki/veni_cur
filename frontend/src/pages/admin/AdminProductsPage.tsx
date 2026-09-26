import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { listAdminProducts } from "../../api/admin/catalog";
import { formatApiValidationError } from "../../api/client";
import { formatPrice } from "../../lib/formatPrice";
import { LoadingGrid } from "../../components/ui/LoadingGrid";
import { StatePanel } from "../../components/ui/StatePanel";

export function AdminProductsPage() {
  const productsQuery = useQuery({
    queryKey: ["admin", "products"],
    queryFn: () => listAdminProducts(1),
  });

  if (productsQuery.isLoading) return <LoadingGrid count={4} />;
  if (productsQuery.isError) {
    return (
      <StatePanel
        title="Could not load products"
        message={formatApiValidationError(productsQuery.error)}
      />
    );
  }

  const products = productsQuery.data?.results ?? [];

  return (
    <section aria-labelledby="admin-products-heading">
      <h1 id="admin-products-heading" className="admin-page-title">
        Products
      </h1>
      <p>
        <Link to="/admin/products/new">Create product</Link>
      </p>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Base price</th>
              <th>Active</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>
                  <Link to={`/admin/products/${product.id}`}>{product.name}</Link>
                </td>
                <td>{product.status}</td>
                <td>{formatPrice(product.base_price)}</td>
                <td>{product.is_active ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
