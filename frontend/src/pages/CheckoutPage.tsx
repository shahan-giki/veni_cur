import { Link, useNavigate } from "react-router-dom";
import { formatApiValidationError } from "../api/client";
import { Button } from "../components/ui/Button";
import { LoadingGrid } from "../components/ui/LoadingGrid";
import { StatePanel } from "../components/ui/StatePanel";
import { useCartQuery } from "../hooks/useCart";
import { useCheckout } from "../hooks/useOrders";
import { formatPrice } from "../lib/formatPrice";
import type { CartItem } from "../api/types/cart";

function SummaryLine({ item }: { item: CartItem }) {
  const variant =
    item.variant_label.trim() ||
    Object.entries(item.variant_attributes)
      .filter(([, v]) => v != null && String(v).trim())
      .map(([k, v]) => `${k}: ${String(v)}`)
      .join(" · ") ||
    "Standard";
  return (
    <li className="checkout-line">
      <div>
        <strong>{item.product_name}</strong>
        <p className="checkout-line__meta">
          {variant} · Qty {item.quantity}
        </p>
      </div>
      <span>{formatPrice(item.line_total)}</span>
    </li>
  );
}

export function CheckoutPage() {
  const cartQuery = useCartQuery();
  const checkoutMutation = useCheckout();
  const navigate = useNavigate();

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
  if (!cart || cart.line_count === 0) {
    return (
      <StatePanel
        title="Nothing to checkout"
        message="Your cart is empty. Add products before placing an order."
        actions={
          <Link to="/products" className="btn btn-primary">
            Shop products
          </Link>
        }
      />
    );
  }

  async function placeOrder() {
    try {
      const order = await checkoutMutation.mutateAsync();
      navigate(`/account/orders/${order.id}`, {
        replace: true,
        state: { placed: true },
      });
    } catch {
      /* error rendered below */
    }
  }

  return (
    <section className="checkout-page" aria-labelledby="checkout-heading">
      <header className="page-header">
        <h1 id="checkout-heading">Checkout</h1>
        <p>Review your order. Payment instructions will come in a later phase.</p>
      </header>
      <ul className="checkout-lines" aria-label="Order summary">
        {cart.items.map((item) => (
          <SummaryLine key={item.id} item={item} />
        ))}
      </ul>
      <p className="cart-summary__subtotal">
        Total ({cart.item_count} items): <strong>{formatPrice(cart.subtotal)}</strong>
      </p>
      {checkoutMutation.isError ? (
        <p className="auth-form__error" role="alert">
          {formatApiValidationError(checkoutMutation.error)}
        </p>
      ) : null}
      <div className="cart-summary__actions">
        <Button
          type="button"
          variant="primary"
          disabled={checkoutMutation.isPending}
          onClick={() => void placeOrder()}
        >
          {checkoutMutation.isPending ? "Placing order…" : "Place order"}
        </Button>
        <Link to="/cart" className="btn btn-secondary">
          Back to cart
        </Link>
      </div>
    </section>
  );
}
