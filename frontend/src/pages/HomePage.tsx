import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { listCategories, listProducts } from "../api/catalog";
import type { PublicCategory, PublicProductListItem } from "../api/types/catalog";
import { catalogKeys } from "../app/queryClient";
import { ProductGrid } from "../components/catalog/ProductGrid";
import { DocumentTitle } from "../components/seo/DocumentTitle";
import { Button } from "../components/ui/Button";
import { LoadingGrid } from "../components/ui/LoadingGrid";
import { StatePanel } from "../components/ui/StatePanel";

export type HomeCollection = {
  category: PublicCategory;
  isEmpty: boolean;
};

/** All top-level categories, with `isEmpty` when no products are listed. */
export function buildHomeCollections(
  categories: PublicCategory[],
  products: PublicProductListItem[]
): HomeCollection[] {
  const withProducts = new Set(products.map((p) => p.category_slug));
  return [...categories]
    .filter((c) => c.parent == null)
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
    .map((category) => ({
      category,
      isEmpty: !withProducts.has(category.slug),
    }));
}

export function HomePage() {
  const featuredQuery = useQuery({
    queryKey: catalogKeys.products({ page: 1, page_size: 8, ordering: "-created_at" }),
    queryFn: () =>
      listProducts({ page: 1, page_size: 8, ordering: "-created_at" }),
  });

  const categoriesQuery = useQuery({
    queryKey: catalogKeys.categories,
    queryFn: listCategories,
  });

  const catalogScanQuery = useQuery({
    queryKey: catalogKeys.products({ page: 1, page_size: 100, purpose: "home-collections" }),
    queryFn: () => listProducts({ page: 1, page_size: 100 }),
  });

  const collections = useMemo(
    () =>
      buildHomeCollections(
        categoriesQuery.data ?? [],
        catalogScanQuery.data?.results ?? []
      ),
    [categoriesQuery.data, catalogScanQuery.data]
  );

  const showCollections =
    categoriesQuery.isSuccess &&
    catalogScanQuery.isSuccess &&
    collections.length > 0;

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
              <Link to="/products" className="home-more-link">
                View all products
              </Link>
            }
          />
        ) : (
          <>
            <ProductGrid products={featuredQuery.data.results} />
            <p className="home-featured__more">
              <Link to="/products" className="home-more-link">
                View all products
              </Link>
            </p>
          </>
        )}
      </section>

      {showCollections ? (
        <>
          <hr className="home-divider" />
          <section
            className="section"
            aria-labelledby="collections-heading"
            id="shop-by-category"
          >
            <h2 id="collections-heading" className="section__title">
              Collections
            </h2>
            <div className="slider">
              <div
                className="slider__track"
                tabIndex={0}
                aria-label="Collections"
                onWheel={(e) => {
                  const el = e.currentTarget;
                  if (el.scrollWidth <= el.clientWidth) return;
                  // Laptop trackpad/mouse: map vertical wheel to horizontal when useful.
                  if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                    el.scrollLeft += e.deltaY;
                    e.preventDefault();
                  }
                }}
              >
                {collections.map(({ category, isEmpty }) =>
                  isEmpty ? (
                    <div
                      key={category.id}
                      className="category-tile category-tile--empty slider__item"
                      aria-label={`${category.name}, empty`}
                    >
                      <span className="category-tile__name">{category.name}</span>
                      <span className="category-tile__status">Empty</span>
                    </div>
                  ) : (
                    <Link
                      key={category.id}
                      to={`/products?category=${encodeURIComponent(category.slug)}`}
                      className="category-tile slider__item"
                    >
                      {category.name}
                    </Link>
                  )
                )}
              </div>
            </div>
          </section>
        </>
      ) : null}
    </>
  );
}
