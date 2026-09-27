import { Link, useLocation } from "react-router-dom";
import { useCartQuery } from "../../hooks/useCart";

function BagIcon() {
  return (
    <svg
      className="veni-cart-icon"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 8h12l-1 12H7L6 8z" />
      <path d="M9 8V7a3 3 0 0 1 6 0v1" />
    </svg>
  );
}

export function HeaderCartLink() {
  const location = useLocation();
  const cartQuery = useCartQuery();
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
      <BagIcon />
      <span className="veni-cart-label" aria-hidden="true">
        Cart
      </span>
      {cartQuery.isLoading ? (
        <span className="veni-cart-badge" aria-hidden="true">
          …
        </span>
      ) : (
        <span className="veni-cart-badge" aria-hidden="true">
          {count}
        </span>
      )}
    </Link>
  );
}
