import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { confirmPasswordReset } from "../api/auth";
import { formatApiValidationError } from "../api/client";
import { Button } from "../components/ui/Button";
import { DocumentTitle } from "../components/seo/DocumentTitle";

export function ResetPasswordPage() {
  const { uid = "", token = "" } = useParams<{ uid: string; token: string }>();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await confirmPasswordReset({
        uid,
        token,
        new_password: password,
      });
      setMessage(res.detail);
    } catch (err) {
      setError(formatApiValidationError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-page" aria-labelledby="reset-heading">
      <DocumentTitle title="Choose a new password" />
      <h1 id="reset-heading">Choose a new password</h1>
      <form className="auth-form" onSubmit={(e) => void onSubmit(e)}>
        <div className="auth-form__field">
          <label htmlFor="reset-password">New password</label>
          <input
            id="reset-password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error ? (
          <p className="auth-form__error" role="alert">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="add-to-cart__ok" role="status">
            {message} <Link to="/login">Sign in</Link>
          </p>
        ) : null}
        <Button type="submit" variant="primary" disabled={submitting || Boolean(message)}>
          {submitting ? "Updating…" : "Update password"}
        </Button>
      </form>
    </section>
  );
}
