import { useQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { listCategories, listProducts } from "../api/catalog";
import { catalogKeys } from "../app/queryClient";
import { ProductGrid } from "../components/catalog/ProductGrid";
import { Button } from "../components/ui/Button";
import { LoadingGrid } from "../components/ui/LoadingGrid";
import { StatePanel } from "../components/ui/StatePanel";

export function HomePage() {
  const navigate = useNavigate();
  const [heroQuery, setHeroQuery] = useState("");

  const categoriesQuery = useQuery({
    queryKey: catalogKeys.categories,
    queryFn: listCategories,
  });

  const featuredQuery = useQuery({
    queryKey: catalogKeys.products({ page: 1, page_size: 8, ordering: "-created_at" }),
    queryFn: () =>
      listProducts({ page: 1, page_size: 8, ordering: "-created_at" }),
  });

  function onHeroSearch(e: FormEvent) {
    e.preventDefault();
    const q = heroQuery.trim();
    navigate(q ? `/products?q=${encodeURIComponent(q)}` : "/products");
  }

  const topLevel =
    categoriesQuery.data?.filter((c) => c.parent === null).sort((a, b) => a.sort_order - b.sort_order) ??
    categoriesQuery.data?.sort((a, b) => a.sort_order - b.sort_order);

  return (
    <>
      <section className="hero section" aria-labelledby="hero-heading">
        <h1 id="hero-heading">Shop Veni</h1>
        <p>Premium products across skincare, fragrance, apparel, and more — curated for you.</p>
        <form className="hero-search" role="search" onSubmit={onHeroSearch}>
          <label className="visually-hidden" htmlFor="hero-search">
            Search the catalog
          </label>
          <input
            id="hero-search"
            type="search"
            placeholder="What are you looking for?"
            value={heroQuery}
            onChange={(e) => setHeroQuery(e.target.value)}
          />
          <Button type="submit" variant="primary">
            Search
          </Button>
        </form>
      </section>

      <section className="section" id="shop-by-category" aria-labelledby="categories-heading">
        <h2 id="categories-heading" className="section__title">
          Shop by category
        </h2>
        {categoriesQuery.isLoading ? (
          <p aria-busy="true">Loading categories…</p>
        ) : categoriesQuery.isError ? (
          <StatePanel
            title="Could not load categories"
            message="Please check your connection and try again."
            actions={
              <Button variant="primary" onClick={() => categoriesQuery.refetch()}>
                Retry
              </Button>
            }
          />
        ) : !topLevel?.length ? (
          <StatePanel title="No categories yet" message="Check back soon for new collections." />
        ) : (
          <div className="category-grid">
            {topLevel.map((cat) => (
              <Link key={cat.id} to={`/categories/${cat.slug}`} className="category-tile">
                {cat.name}
              </Link>
            ))}
          </div>
        )}
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
              <Link to="/products" className="btn btn-secondary">
                View all products
              </Link>
            }
          />
        ) : (
          <>
            <ProductGrid products={featuredQuery.data.results} />
            <p style={{ marginTop: "var(--space-lg)", textAlign: "center" }}>
              <Link to="/products" className="btn btn-secondary">
                View all products
              </Link>
            </p>
          </>
        )}
      </section>

      <section className="section trust-strip" aria-label="Why Veni">
        <div className="trust-strip__item">
          <h3>Authentic products</h3>
          <p>Every item is sourced and quality-checked for our customers.</p>
        </div>
        <div className="trust-strip__item">
          <h3>Secure checkout</h3>
          <p>Manual payment verification keeps your order safe (coming in a later phase).</p>
        </div>
        <div className="trust-strip__item">
          <h3>Multi-category store</h3>
          <p>From daily essentials to specialty finds — one trusted shop.</p>
        </div>
      </section>
    </>
  );
}
