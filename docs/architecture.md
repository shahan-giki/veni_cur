# Architecture

High-level system shape for Veni. Stack is fixed in ADRs (React + Django + Neon + S3 + EC2).

## Request flow (production target)

```text
Browser → Nginx (static + /api proxy) → Django/DRF → PostgreSQL
                                      ↘ presigned S3 (images, payment proofs)
```

## Catalog (Phase 3)

Public read APIs for categories and products; admin CRUD and S3 presigned product image upload. See `apps/catalog/` and ADR-0005.

## Session auth (Phase 5)

Django sessions + CSRF for mutating storefront routes (ADR-0001). `/api/v1/auth/*` for register, login, logout, me.

## Cart (Phase 6)

Guest (session) and Customer cart APIs; prices from server on each read/update. Signing in merges the session cart into the Customer cart. No checkout-side inventory reservation.

## Checkout and orders (Phase 7)

| Endpoint | Purpose |
|----------|---------|
| `POST /api/v1/checkout/` | Atomic checkout from authenticated Customer's cart (requires contact body) |
| `POST /api/v1/checkout/guest/` | Atomic guest checkout from the **session cart** + contact (ADR-0003); clears that cart on success |
| `GET /api/v1/orders/` | Customer order history (paginated) |
| `GET /api/v1/orders/{id}/` | Customer order detail with immutable line snapshots |
| `GET /api/v1/orders/by-token/{access_token}/` | Guest order detail by opaque token |

Checkout revalidates purchasability, recalculates prices from catalog, locks variant rows (`select_for_update`), decrements inventory, freezes contact/shipping onto `Order`, creates `OrderItem` snapshots, clears the relevant cart — one transaction. `Order.total == Order.subtotal` (no shipping fee engine; ADR-0008). No saved address book at launch (ADR-0009). Initial order status: `PENDING_PAYMENT`. **No inventory reservation at cart time.**

Product/variant FKs on `OrderItem` use `SET_NULL`; display uses snapshot fields.

## Manual payment and proof upload (Phase 8)

| Endpoint | Purpose |
|----------|---------|
| `GET /api/v1/payments/instructions/` | Bank / wallet instructions (PKR) |
| `POST /api/v1/payments/presign/` | Presigned POST for private S3 proof |
| `POST /api/v1/payments/confirm/` | Create `Payment` (PENDING); order → `PAYMENT_VERIFICATION` |
| `POST /api/v1/admin/payments/{id}/verify/` | Admin: payment VERIFIED; order → `PROCESSING` |
| `POST /api/v1/admin/payments/{id}/reject/` | Admin: payment REJECTED; order → `PENDING_PAYMENT` |
| `GET /api/v1/admin/payments/{id}/proof/` | Admin: presigned GET for proof object |

Presign/confirm authorize by Customer ownership **or** guest `access_token` for that Order. Upload only while order is `PENDING_PAYMENT` with no active PENDING/VERIFIED payment. Rejected payments remain as history; a new proof creates a new `Payment` row (ADR-0004). S3 keys: `payments/orders/{order_id}/{uuid}.ext`; bucket private (ADR-0005).

**Order status lifecycle:** `PENDING_PAYMENT` → `PAYMENT_VERIFICATION` (proof submitted) → `PROCESSING` (admin verify) → `SHIPPED` (later phases). Reject path: `PAYMENT_VERIFICATION` → `PENDING_PAYMENT`.

## Admin console (Phase 9)

Same React SPA under `/admin/*` with `AdminRoute` (ADMIN role only). Uses existing Phase 3 catalog admin APIs and Phase 8 payment admin APIs, plus:

| Endpoint | Purpose |
|----------|---------|
| `GET /api/v1/admin/orders/` | Paginated order list (`?status=`) |
| `GET /api/v1/admin/orders/{id}/` | Order detail, customer, items, payment history |
| `PATCH /api/v1/admin/orders/{id}/status/` | Admin sets `SHIPPED` or `CANCELLED` (guarded transitions) |

## Production deployment (Phase 10)

EC2 + Nginx + Gunicorn + Neon + private S3. See [`docs/deployment.md`](deployment.md) and [`infrastructure/`](../infrastructure/). Django settings: `config.settings.production`. React build output and collected static files are served by Nginx; Gunicorn handles `/api/` and `/django-admin/`.

## Trust boundary

The browser is untrusted for prices, inventory, roles, and admin actions. Catalog **mutations** are ADMIN-only via `common.permissions.IsAdmin`.

## Codebase design

DRF views stay thin; business rules live in **services** (codebase-design: deep modules, testable seams).
