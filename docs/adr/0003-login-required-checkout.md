# Login required before checkout (no guest checkout)

Status: accepted

Checkout and order placement require an authenticated Customer. Anonymous/guest checkout is out of scope for the initial implementation. Carts are tied to authenticated users; there is no guest cart merge flow in Phase 2–7 unless this ADR is superseded.

**Considered options:** Guest checkout with email-only orders (rejected for initial scope: simpler fraud, payment proof, and order history model).

**Consequences:** Registration/login flows must exist before checkout E2E. Cart endpoints require authentication.
