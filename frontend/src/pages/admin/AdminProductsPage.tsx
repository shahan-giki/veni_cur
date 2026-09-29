import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  activateAdminProduct,
  deactivateAdminProduct,
  listAdminProducts,
} from "../../api/admin/catalog";
import { formatApiValidationError } from "../../api/client";
import { formatPrice } from "../../lib/formatPrice";
import { Button } from "../../components/ui/Button";
import { LoadingGrid } from "../../components/ui/LoadingGrid";
import { StatePanel } from "../../components/ui/StatePanel";

export function AdminProductsPage() {
  const queryClient = useQueryClient();
  const productsQuery = useQuery({
    queryKey: ["admin", "products"],
    queryFn: () => listAdminProducts(1),
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, nextActive }: { id: number; nextActive: boolean }) =>
      nextActive ? activateAdminProduct(id) : deactivateAdminProduct(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
    },
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
      {toggleActive.isError ? (
        <p className="auth-form__error" role="alert">
          {formatApiValidationError(toggleActive.error)}
        </p>
      ) : null}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Base price</th>
              <th>Active</th>
              <th>Actions</th>
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
                <td>
                  <Button
                    type="button"
                    variant={product.is_active ? "outline" : "primary"}
                    disabled={
                      toggleActive.isPending && toggleActive.variables?.id === product.id
                    }
                    onClick={() =>
                      toggleActive.mutate({
                        id: product.id,
                        nextActive: !product.is_active,
                      })
                    }
                  >
                    {product.is_active ? "Deactivate" : "Make active"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
