# Veni

Multi-category B2C e-commerce for Veni-owned products: React storefront + admin, Django REST Framework API, Neon PostgreSQL, private AWS S3, deployed on AWS EC2.

## Phase 1 status

Scaffolding and documentation only — no catalog, cart, checkout, payments, or auth APIs yet.

| Path | Purpose |
|------|---------|
| [`CONTEXT.md`](CONTEXT.md) | Domain glossary |
| [`docs/`](docs/) | ADRs, architecture, testing, roadmap |
| [`design-system/veni/`](design-system/veni/) | UI UX Pro Max design system |
| [`frontend/`](frontend/) | React (Vite) SPA scaffold |
| [`backend/`](backend/) | Django + DRF configuration scaffold |

## Local setup (Phase 1 checks)

**Backend**

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
copy .env.example .env
python manage.py check
```

**Frontend**

```bash
cd frontend
npm install
npm run build
```

## Stack (fixed)

React · Django · DRF · Neon PostgreSQL · AWS S3 · AWS EC2

Not used: Next.js, Drizzle, Auth.js, third-party seller marketplace model.
