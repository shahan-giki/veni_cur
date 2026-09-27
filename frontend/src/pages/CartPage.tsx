import { Link } from "react-router-dom";
import { formatApiValidationError } from "../api/client";
import { DocumentTitle } from "../components/seo/DocumentTitle";
import { Button } from "../components/ui/Button";
import { LoadingGrid } from "../components/ui/LoadingGrid";
import { StatePanel } from "../components/ui/StatePanel";
import { useCartMutations, useCartQuery } from "../hooks/useCart";
import { formatPrice } from "../lib/formatPrice";
import { formatVariantDetail } from "../lib/variantDisplay";
import type { CartItem } from "../api/types/cart";

function TrashIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M4 7h16" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      <path d="M6 7l1 13h10l1-13" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

function CartLineItem({
  item,
  onUpdate,
  onRemove,
  busy,
}: {
  item: CartItem;
  onUpdate: (quantity: number) => void;
  onRemove: () => void;
  busy: boolean;
}) {
  const variantDetail = formatVariantDetail(
    item.variant_label,
    item.variant_attributes
  );

  return (
    <li className="cart-line">
      <Link to={`/products/${item.product_slug}`} className="cart-line__media">
        {item.primary_image_url ? (
          <img src={item.primary_image_url} alt={item.product_name} />
        ) : (
          <span className="product-card__placeholder">No image</span>
        )}
      </Link>
      <div className="cart-line__body">
        <div className="cart-line__header">
          <Link to={`/products/${item.product_slug}`}>
            <h2 className="cart-line__title">{item.product_name}</h2>
          </Link>
          <Button
            type="button"
            variant="ghost"
            className="cart-line__remove"
            aria-label={`Remove ${item.product_name} from cart`}
            disabled={busy}
            onClick={onRemove}
          >
            <TrashIcon />
          </Button>
        </div>
        <p className="cart-line__variant">{variantDetail}</p>
        <p className="cart-line__price">{formatPrice(item.unit_price)} each</p>
        <div className="cart-line__qty">
          <button
            type="button"
            className="cart-line__qty-btn"
            aria-label={`Decrease quantity of ${item.product_name}`}
            disabled={busy || item.quantity <= 1}
            onClick={() => onUpdate(item.quantity - 1)}
          >
            −
          </button>
          <label htmlFor={`qty-${item.id}`} className="visually-hidden">
            Quantity for {item.product_name}
          </label>
          <input
            id={`qty-${item.id}`}
            type="number"
            min={1}
            max={item.inventory_count}
            value={item.quantity}
            disabled={busy}
            aria-label={`Quantity for ${item.product_name}`}
            onChange={(e) => {
              const next = Number.parseInt(e.target.value, 10);
              if (!Number.isFinite(next)) return;
              const clamped = Math.min(
                item.inventory_count,
                Math.max(1, next)
              );
              onUpdate(clamped);
            }}
          />
          <button
            type="button"
            className="cart-line__qty-btn"
            aria-label={`Increase quantity of ${item.product_name}`}
            disabled={busy || item.quantity >= item.inventory_count}
            onClick={() => onUpdate(item.quantity + 1)}
          >
            +
          </button>
        </div>
        <p className="cart-line__line-total">
          Line total: <strong>{formatPrice(item.line_total)}</strong>
        </p>
      </div>
    </li>
  );
}

export function CartPage() {
  const cartQuery = useCartQuery();
  const { updateItem, removeItem, clear } = useCartMutations();
  const busy =
    updateItem.isPending || removeItem.isPending || clear.isPending;

  if (cartQuery.isLoading) {
    return <LoadingGrid count={3} />;
  }

  if (cartQuery.isError) {
    return (
      <StatePanel
        title="Could not load cart"
        message={formatApiValidationError(cartQuery.error)}
        actions={
          <Button variant="primary" onClick={() => cartQuery.refetch()}>
            Retry
          </Button>
        }
      />
    );
  }

  const cart = cartQuery.data;
  if (!cart) {
    return <LoadingGrid count={2} />;
  }
  if (cart.line_count === 0) {
    return (
      <StatePanel
        title="Your cart is empty"
        message="Browse products and add items when you are ready."
        actions={
          <Link to="/products" className="btn btn-primary btn--soft">
            Shop products
          </Link>
        }
      />
    );
  }

  return (
    <section className="cart-page" aria-labelledby="cart-heading">
      <DocumentTitle title="Cart" description="Review items before checkout." />
      <header className="page-header">
        <h1 id="cart-heading">Your cart</h1>
        <p>
          {cart.item_count} item{cart.item_count === 1 ? "" : "s"} · Subtotal{" "}
          <strong>{formatPrice(cart.subtotal)}</strong>
        </p>
      </header>
      <ul className="cart-lines" aria-label="Cart items">
        {cart.items.map((item) => (
          <CartLineItem
            key={item.id}
            item={item}
            busy={busy}
            onUpdate={(quantity) =>
              updateItem.mutate({ itemId: item.id, quantity })
            }
            onRemove={() => removeItem.mutate(item.id)}
          />
        ))}
      </ul>
      <footer className="cart-summary">
        <p className="cart-summary__subtotal">
          Subtotal ({cart.item_count} items):{" "}
          <strong>{formatPrice(cart.subtotal)}</strong>
        </p>
        <p className="cart-summary__note">
          Prices reflect current catalog values and are confirmed again at checkout.
        </p>
        <div className="cart-summary__actions">
          <Button type="button" variant="secondary" className="btn--soft" disabled={busy} onClick={() => clear.mutate()}>
            Clear cart
          </Button>
          <Link to="/checkout" className="btn btn-primary btn--soft">
            Checkout
          </Link>
          <Link to="/products" className="btn btn-ghost btn--soft">
            Continue shopping
          </Link>
        </div>
      </footer>
    </section>
  );
}
