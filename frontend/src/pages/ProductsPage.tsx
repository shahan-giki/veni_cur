import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { listCategories, listProducts } from "../api/catalog";
import { catalogKeys } from "../app/queryClient";
import { Pagination } from "../components/catalog/Pagination";
import { ProductGrid } from "../components/catalog/ProductGrid";
import { Button } from "../components/ui/Button";
import { LoadingGrid } from "../components/ui/LoadingGrid";
import { StatePanel } from "../components/ui/StatePanel";
import { CATALOG_PAGE_SIZE } from "../constants/pagination";
import { PRODUCT_ORDERING_OPTIONS } from "../constants/productOrdering";
import { useProductListParams } from "../hooks/useProductListParams";

export function ProductsPage() {
  const { state, patchParams } = useProductListParams();
  const [draftQ, setDraftQ] = useState(state.q);

  useEffect(() => {
    setDraftQ(state.q);
  }, [state.q]);

  const categoriesQuery = useQuery({
    queryKey: catalogKeys.categories,
    queryFn: listCategories,
  });

  const productsQuery = useQuery({
    queryKey: catalogKeys.products({
      q: state.q || undefined,
      category: state.category || undefined,
      ordering: state.ordering,
      page: state.page,
    }),
    queryFn: () =>
      listProducts({
        q: state.q || undefined,
        category: state.category || undefined,
        ordering: state.ordering,
        page: state.page,
        page_size: CATALOG_PAGE_SIZE,
      }),
  });

  function onSearchSubmit(e: FormEvent) {
    e.preventDefault();
    patchParams({ q: draftQ.trim() }, true);
  }

  const categories = categoriesQuery.data?.slice().sort((a, b) => a.sort_order - b.sort_order) ?? [];
  const activeCategory = categories.find((c) => c.slug === state.category);

  let contextTitle = "All products";
  if (state.q && activeCategory) {
    contextTitle = `“${state.q}” in ${activeCategory.name}`;
  } else if (state.q) {
    contextTitle = `Results for “${state.q}”`;
  } else if (activeCategory) {
    contextTitle = activeCategory.name;
  }

  return (
    <>
      <header className="page-header">
        <h1>{contextTitle}</h1>
        {state.q || state.category ? (
          <p>Use filters below to refine your search.</p>
        ) : (
          <p>Browse our full catalog.</p>
        )}
      </header>

      <div className="listing-layout">
        <aside className="filters" aria-labelledby="filters-heading">
          <h2 id="filters-heading">Filters</h2>
          <label htmlFor="filter-category">Category</label>
          <select
            id="filter-category"
            value={state.category}
            onChange={(e) => patchParams({ category: e.target.value }, true)}
            disabled={categoriesQuery.isLoading}
          >
            <option value="">All categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>
          {state.category ? (
            <Button variant="ghost" onClick={() => patchParams({ category: "" }, true)}>
              Clear category
            </Button>
          ) : null}
        </aside>

        <div>
          {(state.q || state.category) && (
            <div className="filter-chips" aria-label="Active filters">
              {state.q ? (
                <span className="chip">
                  Search: {state.q}
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => {
                      setDraftQ("");
                      patchParams({ q: "" }, true);
                    }}
                  >
                    ×
                  </button>
                </span>
              ) : null}
              {activeCategory ? (
                <span className="chip">
                  {activeCategory.name}
                  <button
                    type="button"
                    aria-label="Remove category filter"
                    onClick={() => patchParams({ category: "" }, true)}
                  >
                    ×
                  </button>
                </span>
              ) : null}
            </div>
          )}

          <div className="listing-toolbar">
            <form className="listing-search" role="search" onSubmit={onSearchSubmit}>
              <label className="visually-hidden" htmlFor="listing-search">
                Search products
              </label>
              <input
                id="listing-search"
                type="search"
                value={draftQ}
                onChange={(e) => setDraftQ(e.target.value)}
                placeholder="Search by name or description…"
              />
              <Button type="submit" variant="primary">
                Search
              </Button>
            </form>
            <div>
              <label htmlFor="sort-order">Sort by</label>
              <select
                id="sort-order"
                value={state.ordering}
                onChange={(e) => patchParams({ ordering: e.target.value as typeof state.ordering }, true)}
              >
                {PRODUCT_ORDERING_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {productsQuery.isLoading ? (
            <LoadingGrid />
          ) : productsQuery.isError ? (
            <StatePanel
              title="Could not load products"
              message="We could not reach the catalog. Please try again."
              actions={
                <Button variant="primary" onClick={() => productsQuery.refetch()}>
                  Retry
                </Button>
              }
            />
          ) : !productsQuery.data?.results.length ? (
            <StatePanel
              title="No products found"
              message="Try clearing search or choosing a different category."
              actions={
                <>
                  <Button
                    variant="primary"
                    onClick={() => {
                      setDraftQ("");
                      patchParams({ q: "", category: "" }, true);
                    }}
                  >
                    Clear filters
                  </Button>
                  <Link to="/" className="btn btn-secondary">
                    Back to home
                  </Link>
                </>
              }
            />
          ) : (
            <>
              <ProductGrid products={productsQuery.data.results} />
              <Pagination
                page={state.page}
                totalCount={productsQuery.data.count}
                pageSize={CATALOG_PAGE_SIZE}
                onPageChange={(page) => patchParams({ page })}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}
