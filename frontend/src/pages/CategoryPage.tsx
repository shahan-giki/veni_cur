import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { getCategory, listProducts } from "../api/catalog";
import { ApiError } from "../api/client";
import { catalogKeys } from "../app/queryClient";
import { ProductGrid } from "../components/catalog/ProductGrid";
import { Button } from "../components/ui/Button";
import { LoadingGrid } from "../components/ui/LoadingGrid";
import { StatePanel } from "../components/ui/StatePanel";
import { CATALOG_PAGE_SIZE } from "../constants/pagination";

export function CategoryPage() {
  const { slug = "" } = useParams<{ slug: string }>();

  const categoryQuery = useQuery({
    queryKey: catalogKeys.category(slug),
    queryFn: () => getCategory(slug),
    enabled: Boolean(slug),
  });

  const productsQuery = useQuery({
    queryKey: catalogKeys.products({ category: slug, page: 1 }),
    queryFn: () =>
      listProducts({ category: slug, page: 1, page_size: CATALOG_PAGE_SIZE }),
    enabled: Boolean(slug) && categoryQuery.isSuccess,
  });

  if (!slug) {
    return <StatePanel title="Category not found" message="Invalid category link." />;
  }

  if (categoryQuery.isLoading) {
    return (
      <>
        <div className="page-header">
          <h1 aria-busy="true">Loading category…</h1>
        </div>
        <LoadingGrid />
      </>
    );
  }

  if (categoryQuery.isError) {
    const notFound = categoryQuery.error instanceof ApiError && categoryQuery.error.status === 404;
    return (
      <StatePanel
        title={notFound ? "Category not found" : "Something went wrong"}
        message={notFound ? "This category may have been removed or the link is incorrect." : undefined}
        actions={
          <>
            {notFound ? null : (
              <Button variant="primary" onClick={() => categoryQuery.refetch()}>
                Retry
              </Button>
            )}
            <Link to="/products" className="btn btn-secondary">
              Browse all products
            </Link>
          </>
        }
      />
    );
  }

  const category = categoryQuery.data!;
  const children = [...(category.children ?? [])].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <>
      <header className="page-header">
        <h1>{category.name}</h1>
        {category.parent_slug ? (
          <p>
            Part of{" "}
            <Link to={`/categories/${category.parent_slug}`}>parent category</Link>
          </p>
        ) : null}
      </header>

      {children.length > 0 ? (
        <section className="section" aria-labelledby="subcategories-heading">
          <h2 id="subcategories-heading" className="section__title">
            Subcategories
          </h2>
          <div className="category-grid">
            {children.map((child) => (
              <Link key={child.id} to={`/categories/${child.slug}`} className="category-tile">
                {child.name}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section aria-labelledby="category-products-heading">
        <h2 id="category-products-heading" className="section__title">
          Products in {category.name}
        </h2>
        {productsQuery.isLoading ? (
          <LoadingGrid />
        ) : productsQuery.isError ? (
          <StatePanel
            title="Could not load products"
            actions={
              <Button variant="primary" onClick={() => productsQuery.refetch()}>
                Retry
              </Button>
            }
          />
        ) : !productsQuery.data?.results.length ? (
          <StatePanel
            title="No products in this category"
            message="Try another category or browse the full catalog."
            actions={
              <>
                <Link to="/products" className="btn btn-primary">
                  All products
                </Link>
                <Link to="/#shop-by-category" className="btn btn-secondary">
                  Categories
                </Link>
              </>
            }
          />
        ) : (
          <>
            <ProductGrid products={productsQuery.data.results} />
            {productsQuery.data.count > CATALOG_PAGE_SIZE ? (
              <p style={{ marginTop: "var(--space-lg)", textAlign: "center" }}>
                <Link
                  to={`/products?category=${encodeURIComponent(slug)}`}
                  className="btn btn-secondary"
                >
                  View all in {category.name}
                </Link>
              </p>
            ) : null}
          </>
        )}
      </section>
    </>
  );
}
