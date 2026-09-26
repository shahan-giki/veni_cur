import { Link } from "react-router-dom";
import { formatApiValidationError } from "../api/client";
import { Button } from "../components/ui/Button";
import { LoadingGrid } from "../components/ui/LoadingGrid";
import { StatePanel } from "../components/ui/StatePanel";
import { useCartMutations, useCartQuery } from "../hooks/useCart";
import { formatPrice } from "../lib/formatPrice";
import type { CartItem } from "../api/types/cart";

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
  const attrParts = Object.entries(item.variant_attributes)
    .filter(([, v]) => v != null && String(v).trim() !== "")
    .map(([k, v]) => `${k}: ${String(v)}`);
  const variantDetail =
    item.variant_label.trim() || (attrParts.length ? attrParts.join(" · ") : "Standard");

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
        <Link to={`/products/${item.product_slug}`}>
          <h2 className="cart-line__title">{item.product_name}</h2>
        </Link>
        <p className="cart-line__variant">{variantDetail}</p>
        <p className="cart-line__price">{formatPrice(item.unit_price)} each</p>
        <div className="cart-line__qty">
          <label htmlFor={`qty-${item.id}`}>Quantity</label>
          <input
            id={`qty-${item.id}`}
            type="number"
            min={1}
            max={item.inventory_count}
            value={item.quantity}
            disabled={busy}
            onChange={(e) => {
              const next = Number.parseInt(e.target.value, 10);
              if (Number.isFinite(next) && next >= 1) onUpdate(next);
            }}
          />
        </div>
        <p className="cart-line__line-total">
          Line total: <strong>{formatPrice(item.line_total)}</strong>
        </p>
        <Button
          type="button"
          variant="ghost"
          aria-label={`Remove ${item.product_name} from cart`}
          disabled={busy}
          onClick={onRemove}
        >
          Remove
        </Button>
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
          <Link to="/products" className="btn btn-primary">
            Shop products
          </Link>
        }
      />
    );
  }

  return (
    <section className="cart-page" aria-labelledby="cart-heading">
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
          <Button type="button" variant="secondary" disabled={busy} onClick={() => clear.mutate()}>
            Clear cart
          </Button>
          <Link to="/checkout" className="btn btn-primary">
            Checkout
          </Link>
          <Link to="/products" className="btn btn-ghost">
            Continue shopping
          </Link>
        </div>
      </footer>
    </section>
  );
}
