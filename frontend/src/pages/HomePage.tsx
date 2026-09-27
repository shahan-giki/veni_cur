import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { listProducts } from "../api/catalog";
import { catalogKeys } from "../app/queryClient";
import { ProductGrid } from "../components/catalog/ProductGrid";
import { DocumentTitle } from "../components/seo/DocumentTitle";
import { Button } from "../components/ui/Button";
import { LoadingGrid } from "../components/ui/LoadingGrid";
import { StatePanel } from "../components/ui/StatePanel";

export function HomePage() {
  const featuredQuery = useQuery({
    queryKey: catalogKeys.products({ page: 1, page_size: 8, ordering: "-created_at" }),
    queryFn: () =>
      listProducts({ page: 1, page_size: 8, ordering: "-created_at" }),
  });

  return (
    <>
      <DocumentTitle
        title="Home"
        description="Premium products across skincare, fragrance, apparel, and more — curated for you."
      />
      <section className="hero section" aria-labelledby="hero-heading">
        <h1 id="hero-heading">Shop Veni</h1>
        <p>Premium products across skincare, fragrance, apparel, and more — curated for you.</p>
      </section>

      <section className="section" aria-labelledby="featured-heading">
        <h2 id="featured-heading" className="section__title">
          Featured products
        </h2>
        {featuredQuery.isLoading ? (
          <LoadingGrid count={4} />
        ) : featuredQuery.isError ? (
          <StatePanel
            title="Could not load products"
            actions={
              <Button variant="primary" onClick={() => featuredQuery.refetch()}>
                Retry
              </Button>
            }
          />
        ) : !featuredQuery.data?.results.length ? (
          <StatePanel
            title="No products yet"
            message="Browse the catalog when items are available."
            actions={
              <Link to="/products" className="btn btn-secondary btn--soft">
                View all products
              </Link>
            }
          />
        ) : (
          <>
            <ProductGrid products={featuredQuery.data.results} />
            <p className="home-featured__more">
              <Link to="/products" className="btn btn-secondary btn--soft">
                View all products
              </Link>
            </p>
          </>
        )}
      </section>
    </>
  );
}
