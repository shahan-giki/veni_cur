import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { formatApiValidationError } from "../api/client";
import type { CheckoutContact, PaymentMethod } from "../api/types/order";
import type { CartItem } from "../api/types/cart";
import { useAuth } from "../auth/AuthProvider";
import { DocumentTitle } from "../components/seo/DocumentTitle";
import { Button } from "../components/ui/Button";
import { LoadingGrid } from "../components/ui/LoadingGrid";
import { StatePanel } from "../components/ui/StatePanel";
import { useCartQuery } from "../hooks/useCart";
import { useCheckout } from "../hooks/useOrders";
import { formatPrice } from "../lib/formatPrice";
import { formatVariantDetail } from "../lib/variantDisplay";

function SummaryLine({ item }: { item: CartItem }) {
  const variant = formatVariantDetail(item.variant_label, item.variant_attributes);
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

type ContactField = Exclude<keyof CheckoutContact, "payment_method">;

const emptyContact: CheckoutContact = {
  name: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  payment_method: "MANUAL_TRANSFER",
};

export function CheckoutPage() {
  const cartQuery = useCartQuery();
  const checkoutMutation = useCheckout();
  const navigate = useNavigate();
  const { user, status } = useAuth();
  const [contact, setContact] = useState<CheckoutContact>(() => ({
    ...emptyContact,
    email: user?.email ?? "",
    name: [user?.first_name, user?.last_name].filter(Boolean).join(" "),
  }));

  if (cartQuery.isLoading || status === "loading") {
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
          <Link to="/products" className="btn btn-primary btn--soft">
            Shop products
          </Link>
        }
      />
    );
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      const order = await checkoutMutation.mutateAsync(contact);
      if (status === "authenticated" && user?.role === "CUSTOMER") {
        navigate(`/account/orders/${order.id}`, {
          replace: true,
          state: { placed: true },
        });
      } else if (order.access_token) {
        navigate(`/orders/guest/${order.access_token}`, {
          replace: true,
          state: { placed: true },
        });
      }
    } catch {
      /* error rendered below */
    }
  }

  function field(
    key: ContactField,
    label: string,
    opts: { type?: string; inputMode?: string; autoComplete?: string; required?: boolean } = {}
  ) {
    const id = `checkout-${key}`;
    return (
      <div className="auth-form__field">
        <label htmlFor={id}>{label}</label>
        <input
          id={id}
          name={key}
          type={opts.type ?? "text"}
          inputMode={opts.inputMode as "tel" | "email" | "text" | undefined}
          autoComplete={opts.autoComplete}
          required={opts.required !== false}
          value={contact[key]}
          onChange={(e) => setContact((c) => ({ ...c, [key]: e.target.value }))}
        />
      </div>
    );
  }

  function setPaymentMethod(method: PaymentMethod) {
    setContact((c) => ({ ...c, payment_method: method }));
  }

  return (
    <section className="checkout-page" aria-labelledby="checkout-heading">
      <DocumentTitle
        title="Checkout"
        description="Enter shipping details and place your Veni order."
      />
      <header className="page-header">
        <h1 id="checkout-heading">Checkout</h1>
        <p>
          Enter shipping details, choose how you will pay, and place your order.
          {status !== "authenticated" ? (
            <>
              {" "}
              Already have an account? <Link to="/login">Sign in</Link> (optional).
            </>
          ) : null}
        </p>
      </header>

      <form className="auth-form checkout-form" onSubmit={(e) => void onSubmit(e)}>
        <h2 className="checkout-form__title">Shipping & contact</h2>
        {field("name", "Full name", { autoComplete: "name" })}
        {field("phone", "Phone", {
          type: "tel",
          inputMode: "tel",
          autoComplete: "tel",
        })}
        {field("email", "Email", {
          type: "email",
          inputMode: "email",
          autoComplete: "email",
        })}
        {field("address", "Address", { autoComplete: "street-address" })}
        {field("city", "City", { autoComplete: "address-level2" })}

        <fieldset className="checkout-pay-methods">
          <legend className="checkout-form__title">Payment method</legend>
          <label className="checkout-pay-option">
            <input
              type="radio"
              name="payment_method"
              value="MANUAL_TRANSFER"
              checked={contact.payment_method === "MANUAL_TRANSFER"}
              onChange={() => setPaymentMethod("MANUAL_TRANSFER")}
            />
            <span>
              <strong>Bank / wallet transfer</strong>
              <span className="checkout-pay-option__hint">
                Pay now, then upload a receipt on your order page.
              </span>
            </span>
          </label>
          <label className="checkout-pay-option">
            <input
              type="radio"
              name="payment_method"
              value="CASH_ON_DELIVERY"
              checked={contact.payment_method === "CASH_ON_DELIVERY"}
              onChange={() => setPaymentMethod("CASH_ON_DELIVERY")}
            />
            <span>
              <strong>Cash on delivery</strong>
              <span className="checkout-pay-option__hint">
                Pay the courier in cash when your parcel arrives.
              </span>
            </span>
          </label>
        </fieldset>

        <h2 className="checkout-form__title">Order summary</h2>
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
          <Button type="submit" variant="primary" disabled={checkoutMutation.isPending}>
            {checkoutMutation.isPending ? "Placing order…" : "Place order"}
          </Button>
          <Link to="/cart" className="btn btn-secondary">
            Back to cart
          </Link>
        </div>
      </form>
    </section>
  );
}
