# Veni infrastructure (Phase 10)

Deployment artifacts for **EC2 + Nginx + Gunicorn** (ADR-0006). Application code stays in `backend/` and `frontend/`; this directory is the **operations seam** — configs and scripts with a small, stable surface.

| Path | Role |
|------|------|
| `nginx/veni.conf` | Site config: static SPA, `/api/`, `/django-admin/` |
| `systemd/gunicorn.*` | Socket-activated Gunicorn |
| `.env.production.example` | Required production environment variables |
| `deploy.sh` | Pull, migrate, collectstatic, build, restart |

Full runbook: [`docs/deployment.md`](../docs/deployment.md).
