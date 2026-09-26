import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { useCartQuery } from "../../hooks/useCart";

export function HeaderCartLink() {
  const { status, user } = useAuth();
  const location = useLocation();
  const cartQuery = useCartQuery();
  const isCustomer = status === "authenticated" && user?.role === "CUSTOMER";

  if (!isCustomer) {
    return (
      <Link
        to="/login"
        state={{ from: "/cart" }}
        className="veni-cart-link"
        aria-label="Sign in to view cart"
      >
        Cart
      </Link>
    );
  }

  const count = cartQuery.data?.item_count ?? 0;
  const label =
    count > 0 ? `Cart, ${count} item${count === 1 ? "" : "s"}` : "Cart, empty";

  return (
    <Link
      to="/cart"
      className="veni-cart-link"
      aria-label={label}
      aria-current={location.pathname === "/cart" ? "page" : undefined}
    >
      <span aria-hidden="true">Cart</span>
      {cartQuery.isLoading ? (
        <span className="veni-cart-badge" aria-hidden="true">
          …
        </span>
      ) : (
        <span className="veni-cart-badge">{count}</span>
      )}
    </Link>
  );
}
