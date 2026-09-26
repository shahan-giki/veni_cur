import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getProduct } from "../api/catalog";
import { ApiError } from "../api/client";
import { catalogKeys } from "../app/queryClient";
import { AvailabilityBadge } from "../components/catalog/AvailabilityBadge";
import { ProductGallery } from "../components/catalog/ProductGallery";
import { AddToCartBlock } from "../components/catalog/AddToCartBlock";
import { VariantSelector } from "../components/catalog/VariantSelector";
import { Button } from "../components/ui/Button";
import { StatePanel } from "../components/ui/StatePanel";
import { formatPrice } from "../lib/formatPrice";
import { pickDefaultVariant } from "../lib/variantDisplay";

export function ProductDetailPage() {
  const { slug = "" } = useParams<{ slug: string }>();

  const productQuery = useQuery({
    queryKey: catalogKeys.product(slug),
    queryFn: () => getProduct(slug),
    enabled: Boolean(slug),
  });

  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);

  if (!slug) {
    return <StatePanel title="Product not found" />;
  }

  if (productQuery.isLoading) {
    return (
      <div className="pdp" aria-busy="true">
        <div className="skeleton-card" style={{ minHeight: "20rem" }} />
        <div className="skeleton-card" style={{ minHeight: "20rem" }} />
      </div>
    );
  }

  if (productQuery.isError) {
    const notFound = productQuery.error instanceof ApiError && productQuery.error.status === 404;
    return (
      <StatePanel
        title={notFound ? "Product not found" : "Something went wrong"}
        message={notFound ? "This product may no longer be available." : undefined}
        actions={
          <>
            {!notFound ? (
              <Button variant="primary" onClick={() => productQuery.refetch()}>
                Retry
              </Button>
            ) : null}
            <Link to="/products" className="btn btn-secondary">
              Back to products
            </Link>
          </>
        }
      />
    );
  }

  const product = productQuery.data!;
  const variants = product.variants;
  const defaultVariant = pickDefaultVariant(variants);
  const selectedVariant =
    variants.find((v) => v.id === selectedVariantId) ?? defaultVariant ?? null;
  const displayPrice = selectedVariant?.effective_price ?? product.effective_price;
  const inventory = selectedVariant?.inventory_count ?? 0;

  return (
    <>
      <nav aria-label="Breadcrumb" className="page-header">
        <p>
          <Link to="/products">Products</Link>
          {" · "}
          <Link to={`/products?category=${encodeURIComponent(product.category_slug)}`}>
            {product.category_slug.replace(/-/g, " ")}
          </Link>
        </p>
      </nav>
      <article className="pdp">
        <ProductGallery images={product.images} productName={product.name} />
        <div>
          <h1>{product.name}</h1>
          <p className="pdp__price">{formatPrice(displayPrice)}</p>
          {selectedVariant ? (
            <>
              <AvailabilityBadge inventoryCount={inventory} />
              {selectedVariant.sku ? (
                <p className="pdp__sku">SKU: {selectedVariant.sku}</p>
              ) : null}
            </>
          ) : null}
          <VariantSelector
            variants={variants}
            selectedId={selectedVariant?.id ?? null}
            onSelect={(v) => setSelectedVariantId(v.id)}
          />
          <AddToCartBlock productName={product.name} selectedVariant={selectedVariant} />
          {product.description ? (
            <div className="pdp__description">
              <h2 className="visually-hidden">Description</h2>
              <p>{product.description}</p>
            </div>
          ) : null}
          <p style={{ marginTop: "var(--space-xl)" }}>
            <Link to="/products" className="btn btn-secondary">
              Continue shopping
            </Link>
          </p>
        </div>
      </article>
    </>
  );
}
