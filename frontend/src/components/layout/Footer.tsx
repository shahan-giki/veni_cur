import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";

function scrollToPageStart() {
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

export function Footer() {
  const { status, user, logout } = useAuth();
  const navigate = useNavigate();

  function goToAllProducts() {
    navigate("/products");
    scrollToPageStart();
  }

  return (
    <footer className="veni-footer">
      <div className="veni-footer__inner">
        <p>© {new Date().getFullYear()} Veni</p>
        <nav aria-label="Footer" className="veni-footer__nav">
          <Link to="/contact">Contact</Link>
          <Link to="/shipping-returns">Shipping & returns</Link>
          <Link to="/payment-info">Payment</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/cancellation">Cancellation</Link>
          <button type="button" className="veni-footer__btn" onClick={goToAllProducts}>
            All products
          </button>
          {status === "loading" ? null : user ? (
            <>
              <Link to="/account">Account</Link>
              <button
                type="button"
                className="veni-footer__btn"
                onClick={() => {
                  void logout().then(() => navigate("/"));
                }}
              >
                Sign out
              </button>
            </>
          ) : (
            <Link to="/login">Sign in</Link>
          )}
        </nav>
      </div>
    </footer>
  );
}
