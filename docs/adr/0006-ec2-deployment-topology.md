# EC2 deployment: Nginx, Django, React static build

Status: accepted

Production runs on **AWS EC2**. **Neon PostgreSQL** is the managed database (connection string via environment). **Nginx** terminates TLS, serves the React production build as static files, and reverse-proxies `/api/` (and Django admin if enabled) to Gunicorn running Django. This same-origin layout supports session cookies and CSRF without a separate BFF. Environment-specific settings live in `config.settings.production`.

**Considered options:** Separate frontend host on S3/CloudFront only (deferred: complicates session/CSRF for initial release); Next.js SSR (rejected: out of stack).

**Consequences:** Build pipeline produces `frontend/dist` deployed beside Django. `ALLOWED_HOSTS`, `CSRF_TRUSTED_ORIGINS`, and cookie Secure flags must match the public origin.
