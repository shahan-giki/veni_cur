# Testing strategy

Aligned with Phase 0 and Matt Pocock **tdd**: test behavior through **public service seams**, not serializer or ORM internals.

## Backend (pytest + pytest-django, Phase 2+)

**Unit (priority):**

- Cart line validation (inventory, effective price)
- Checkout: multi-category cart → order totals and **order item snapshots**
- Payment state machine: pending → verified / rejected → re-upload allowed paths

**Integration:**

- DRF permissions: Customer cannot call admin routes; cannot set payment status
- Session + CSRF on mutating endpoints (when implemented)

**Fixtures:**

- One order containing lines from Skincare, Oral Care, Perfumes, Shawls, and Peshawari Chappals categories (seed data names only)

## Frontend (Phase 4+)

- Component tests with mocked API (variant selector, cart quantity)
- E2E (later): login → add to cart → checkout → upload proof (test bucket or mocked presign)

## Phase 3 (catalog)

- **Backend tests** in `backend/tests/` covering catalog, auth, cart (`test_cart_api.py`), checkout/orders (`test_checkout_api.py`), and manual payment proof upload (`test_payment_api.py`).
- Run: `cd backend && python -m pytest`
- S3 tests use `PRODUCT_IMAGE_STORAGE_BACKEND=memory` (default in development settings).

## Phase 1

No business tests yet. Verification is limited to `python manage.py check` and `npm run build` on scaffolding.
