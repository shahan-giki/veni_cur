import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "../api/auth";
import { formatApiValidationError } from "../api/client";
import { Button } from "../components/ui/Button";
import { DocumentTitle } from "../components/seo/DocumentTitle";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await requestPasswordReset(email.trim());
      setMessage(res.detail);
    } catch (err) {
      setError(formatApiValidationError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-page" aria-labelledby="forgot-heading">
      <DocumentTitle title="Reset password" />
      <h1 id="forgot-heading">Reset password</h1>
      <p className="auth-page__lead">
        Enter your email and we will send reset instructions if an account exists.
      </p>
      <form className="auth-form" onSubmit={(e) => void onSubmit(e)}>
        <div className="auth-form__field">
          <label htmlFor="forgot-email">Email</label>
          <input
            id="forgot-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        {error ? (
          <p className="auth-form__error" role="alert">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="add-to-cart__ok" role="status">
            {message}
          </p>
        ) : null}
        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? "Sending…" : "Send reset link"}
        </Button>
      </form>
      <p className="auth-page__footer">
        <Link to="/login">Back to sign in</Link>
      </p>
    </section>
  );
}
