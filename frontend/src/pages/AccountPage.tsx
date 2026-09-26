import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { Button } from "../components/ui/Button";

export function AccountPage() {
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  async function onLogout() {
    await logout();
  }

  return (
    <section className="auth-page account-page" aria-labelledby="account-heading">
      <h1 id="account-heading">Your account</h1>
      <dl className="account-details">
        <div>
          <dt>Email</dt>
          <dd>{user.email}</dd>
        </div>
        <div>
          <dt>Name</dt>
          <dd>
            {[user.first_name, user.last_name].filter(Boolean).join(" ") || "—"}
          </dd>
        </div>
        <div>
          <dt>Role</dt>
          <dd>{user.role === "ADMIN" ? "Administrator" : "Customer"}</dd>
        </div>
      </dl>
      <p className="auth-page__lead">
        View your order history or continue shopping. Payment upload arrives in Phase 8.
      </p>
      <div className="account-actions">
        <Link to="/account/orders" className="btn btn-primary">
          Order history
        </Link>
        <Link to="/cart" className="btn btn-secondary">
          View cart
        </Link>
        <Button type="button" variant="secondary" onClick={() => void onLogout()}>
          Sign out
        </Button>
        <Link to="/products" className="btn btn-ghost">
          Continue shopping
        </Link>
      </div>
    </section>
  );
}
