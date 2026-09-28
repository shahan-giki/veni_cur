import { Link } from "react-router-dom";
import { useState, type FormEvent } from "react";
import { changePassword } from "../api/auth";
import { formatApiValidationError } from "../api/client";
import { useAuth } from "../auth/AuthProvider";
import { Button } from "../components/ui/Button";
import { DocumentTitle } from "../components/seo/DocumentTitle";

export function AccountPage() {
  const { user, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdOk, setPwdOk] = useState<string | null>(null);
  const [pwdBusy, setPwdBusy] = useState(false);

  if (!user) {
    return null;
  }

  async function onLogout() {
    await logout();
  }

  async function onChangePassword(e: FormEvent) {
    e.preventDefault();
    setPwdError(null);
    setPwdOk(null);
    setPwdBusy(true);
    try {
      const res = await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPwdOk(res.detail);
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setPwdError(formatApiValidationError(err));
    } finally {
      setPwdBusy(false);
    }
  }

  return (
    <section className="auth-page account-page" aria-labelledby="account-heading">
      <DocumentTitle title="Your account" />
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
      <form className="auth-form" onSubmit={(e) => void onChangePassword(e)}>
        <h2 className="checkout-form__title">Change password</h2>
        <div className="auth-form__field">
          <label htmlFor="current-password">Current password</label>
          <input
            id="current-password"
            type="password"
            autoComplete="current-password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>
        <div className="auth-form__field">
          <label htmlFor="new-password">New password</label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        {pwdError ? (
          <p className="auth-form__error" role="alert">
            {pwdError}
          </p>
        ) : null}
        {pwdOk ? (
          <p className="add-to-cart__ok" role="status">
            {pwdOk}
          </p>
        ) : null}
        <Button type="submit" variant="secondary" disabled={pwdBusy}>
          {pwdBusy ? "Updating…" : "Update password"}
        </Button>
      </form>
      <p className="auth-page__lead">View your order history or continue shopping.</p>
      <div className="account-actions">
        {user.role === "ADMIN" ? (
          <Link to="/admin" className="btn btn-primary">
            Open admin console
          </Link>
        ) : null}
        <Link
          to="/account/orders"
          className={user.role === "ADMIN" ? "btn btn-secondary" : "btn btn-primary"}
        >
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
