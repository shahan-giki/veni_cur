import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getProduct, listProducts } from "../api/catalog";
import { ApiError } from "../api/client";
import { catalogKeys } from "../app/queryClient";
import { AvailabilityBadge } from "../components/catalog/AvailabilityBadge";
import { ProductGallery } from "../components/catalog/ProductGallery";
import { ProductGrid } from "../components/catalog/ProductGrid";
import { AddToCartBlock } from "../components/catalog/AddToCartBlock";
import { VariantSelector } from "../components/catalog/VariantSelector";
import { DocumentTitle } from "../components/seo/DocumentTitle";
import { JsonLd } from "../components/seo/JsonLd";
import { Button } from "../components/ui/Button";
import { StatePanel } from "../components/ui/StatePanel";
import { formatPrice } from "../lib/formatPrice";
import { buildProductJsonLd } from "../lib/productJsonLd";
import { pickDefaultVariant } from "../lib/variantDisplay";

function formatAttrKey(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function metaFromVariant(
  attributes: Record<string, unknown> | undefined,
  categorySlug: string
): string {
  const parts = Object.entries(attributes ?? {})
    .filter(([, v]) => v != null && String(v).trim() !== "")
    .map(([, v]) => String(v).trim());
  if (categorySlug) {
    parts.push(categorySlug.replace(/-/g, " "));
  }
  return parts.join(" · ");
}

export function ProductDetailPage() {
  const { slug = "" } = useParams<{ slug: string }>();

  const productQuery = useQuery({
    queryKey: catalogKeys.product(slug),
    queryFn: () => getProduct(slug),
    enabled: Boolean(slug),
  });

  const product = productQuery.data;
  const categorySlug = product?.category_slug ?? "";

  const relatedQuery = useQuery({
    queryKey: catalogKeys.products({
      category: categorySlug || undefined,
      page: 1,
      page_size: 4,
      ordering: "-created_at",
    }),
    queryFn: () =>
      listProducts({
        category: categorySlug || undefined,
        page: 1,
        page_size: 4,
        ordering: "-created_at",
      }),
    enabled: Boolean(categorySlug),
  });

  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);

  const variants = product?.variants ?? [];
  const defaultVariant = pickDefaultVariant(variants);
  const selectedVariant =
    variants.find((v) => v.id === selectedVariantId) ?? defaultVariant ?? null;

  const pageUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/products/${slug}`
      : `/products/${slug}`;

  const jsonLd = useMemo(() => {
    if (!product) return null;
    return buildProductJsonLd({
      product,
      variant: selectedVariant,
      pageUrl,
    });
  }, [product, selectedVariant, pageUrl]);

  const related =
    relatedQuery.data?.results.filter((p) => p.slug !== slug).slice(0, 4) ?? [];

  if (!slug) {
    return <StatePanel title="Product not found" />;
  }

  if (productQuery.isLoading) {
    return (
      <div className="pdp" aria-busy="true">
        <div className="pdp__top">
          <div className="skeleton-card" style={{ minHeight: "14rem" }} />
          <div className="skeleton-card" style={{ minHeight: "14rem" }} />
        </div>
      </div>
    );
  }

  if (productQuery.isError) {
    const notFound =
      productQuery.error instanceof ApiError && productQuery.error.status === 404;
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
            <Link to="/products" className="btn btn-secondary btn--soft">
              Back to products
            </Link>
          </>
        }
      />
    );
  }

  if (!product) {
    return <StatePanel title="Product not found" />;
  }

  const displayPrice = selectedVariant?.effective_price ?? product.effective_price;
  const inventory = selectedVariant?.inventory_count ?? 0;
  const meta = metaFromVariant(selectedVariant?.attributes, product.category_slug);
  const detailEntries = Object.entries(selectedVariant?.attributes ?? {}).filter(
    ([, v]) => v != null && String(v).trim() !== ""
  );

  return (
    <>
      <DocumentTitle
        title={product.name}
        description={
          product.description.trim() ||
          `${product.name} — shop at Veni. Prices in PKR.`
        }
      />
      {jsonLd ? <JsonLd data={jsonLd} /> : null}
      <article className="pdp">
        <div className="pdp__top">
          <ProductGallery images={product.images} productName={product.name} />
          <div className="pdp__buy">
            <h1>{product.name}</h1>
            <p className="pdp__price">{formatPrice(displayPrice)}</p>
            {meta ? <p className="pdp__meta">{meta}</p> : null}
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
          </div>
        </div>

        <div className="pdp__info">
          {product.description.trim() ? (
            <section className="pdp__description" aria-labelledby="pdp-desc-heading">
              <h2 id="pdp-desc-heading" className="pdp__section-title">
                Product description
              </h2>
              <p>{product.description.trim()}</p>
            </section>
          ) : null}

          <div className="pdp__accordions">
            <details className="pdp-accordion">
              <summary className="pdp-accordion__summary">
                <span aria-hidden="true" className="pdp-accordion__icon">
                  +
                </span>
                Product details &amp; composition
              </summary>
              <div className="pdp-accordion__body">
                {selectedVariant?.sku ? <p>SKU: {selectedVariant.sku}</p> : null}
                {detailEntries.length > 0 ? (
                  <dl className="pdp-accordion__facts">
                    {detailEntries.map(([key, value]) => (
                      <div key={key}>
                        <dt>{formatAttrKey(key)}</dt>
                        <dd>{String(value)}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p>Details for this option will appear here when available.</p>
                )}
              </div>
            </details>

            <details className="pdp-accordion">
              <summary className="pdp-accordion__summary">
                <span aria-hidden="true" className="pdp-accordion__icon">
                  +
                </span>
                Deliveries &amp; returns
              </summary>
              <div className="pdp-accordion__body">
                <p>
                  Review shipping timelines, returns, and payment options before you
                  order.
                </p>
                <p className="pdp__policies">
                  <Link to="/shipping-returns">Shipping &amp; returns</Link>
                  {" · "}
                  <Link to="/payment-info">Payment</Link>
                </p>
              </div>
            </details>
          </div>

          {related.length > 0 ? (
            <section className="pdp__related" aria-labelledby="pdp-related-heading">
              <h2 id="pdp-related-heading" className="pdp__section-title">
                You may also like
              </h2>
              <ProductGrid products={related} />
            </section>
          ) : null}
        </div>
      </article>
    </>
  );
}
