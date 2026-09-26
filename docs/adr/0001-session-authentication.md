# Session authentication with CSRF for the React SPA

Status: accepted

Veni uses Django session authentication for Customers and Admins. The React SPA runs on the same site as the API in production (Nginx on EC2 serves static frontend and proxies `/api` to Django). Session cookies are HttpOnly, use SameSite protection, and are Secure in production. Mutating API requests use CSRF protection compatible with DRF session authentication. The frontend never stores roles or payment state in trusted local storage; `/api/v1/auth/me/` (Phase 2+) is the source of truth for identity.

**Considered options:** JWT in localStorage (rejected: XSS exposure and client-trusted claims); JWT in HttpOnly cookies only (deferred: sessions are simpler for same-origin deploy).

**Consequences:** Frontend must send credentials on API calls and obtain CSRF token for unsafe methods. Local Vite dev requires explicit CORS/CSRF trusted origins configuration.
