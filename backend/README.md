# Veni backend

Django + Django REST Framework scaffold (Phase 1).

## Apps

- `apps.accounts` — email login, CUSTOMER/ADMIN roles, session auth API
- `apps.catalog` — categories, products, variants, images
- `apps.cart` — cart
- `apps.orders` — checkout, orders
- `apps.payments` — manual payment + S3 proof

## Settings

- `config.settings.development` — default for `manage.py`; SQLite if `DATABASE_URL` unset
- `config.settings.production` — EC2; requires `DATABASE_URL` (Neon) and `DJANGO_SECRET_KEY`

Copy `.env.example` to `.env` for local development.

## Catalog (Phase 3)

```bash
python manage.py migrate
python manage.py seed_categories
python manage.py runserver
```

Public catalog: `GET /api/v1/categories/`, `GET /api/v1/products/`  
Session auth: `POST /api/v1/auth/register|login|logout`, `GET /api/v1/auth/me/`, `GET /api/v1/auth/csrf/`  
Customer cart: `GET/DELETE /api/v1/cart/`, `POST/PATCH/DELETE /api/v1/cart/items/...` (CUSTOMER + session + CSRF on writes)  
Checkout/orders: `POST /api/v1/checkout/`, `GET /api/v1/orders/`, `GET /api/v1/orders/{id}/`  
OpenAPI: `/api/v1/docs/`

SPA clients must send `credentials: include` and `X-CSRFToken` (from `csrftoken` cookie) on unsafe auth requests. See ADR-0001 and `docs/architecture.md`.
