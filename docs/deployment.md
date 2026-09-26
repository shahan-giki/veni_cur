# Veni production deployment (EC2)

Single-origin layout per [ADR-0006](adr/0006-ec2-deployment-topology.md): **Nginx** serves the React build and proxies **`/api/`** to **Gunicorn** (Django). Session cookies and CSRF work because the browser sees one public host.

| Path | Handler |
|------|---------|
| `/`, `/products`, `/admin/*` (React admin console) | Nginx → `frontend/dist` (SPA fallback) |
| `/api/` | Nginx → Gunicorn |
| `/django-admin/` | Nginx → Gunicorn (Django staff UI) |
| `/static/` | Nginx → collected Django static files |

Infrastructure files live in [`infrastructure/`](../infrastructure/).

---

## 1. Server preparation (Ubuntu 22.04 / 24.04)

```bash
sudo apt update
sudo apt install -y nginx git python3 python3-venv python3-pip \
  postgresql-client certbot python3-certbot-nginx

# Node.js 20 LTS (NodeSource or nvm — example using NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Create layout:

```bash
sudo mkdir -p /var/www/veni/{repo,static,frontend/dist}
sudo chown -R ubuntu:www-data /var/www/veni
```

Add `ubuntu` to `www-data` so Gunicorn can use the socket:

```bash
sudo usermod -aG www-data ubuntu
```

---

## 2. Clone the repository

```bash
cd /var/www/veni
git clone <your-repo-url> repo
cd repo
git checkout main
```

---

## 3. Production environment file

```bash
cp infrastructure/.env.production.example /var/www/veni/repo/backend/.env
chmod 600 /var/www/veni/repo/backend/.env
```

Edit `.env`:

- `DJANGO_SECRET_KEY` — long random string
- `DATABASE_URL` — Neon PostgreSQL connection string (`sslmode=require`)
- `DJANGO_ALLOWED_HOSTS` — public hostname(s)
- `CORS_ALLOWED_ORIGINS` / `CSRF_TRUSTED_ORIGINS` — `https://yourdomain.com`
- S3 bucket name and region; use an **IAM instance profile** on EC2 when possible (leave access keys empty)

For the frontend build on the server:

```bash
export VITE_API_BASE_URL=/api/v1
```

(`frontend` uses same-origin `/api/v1` in production when this is set at build time.)

---

## 4. Python virtual environment (first time)

```bash
cd /var/www/veni/repo/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
set -a && source .env && set +a
export DJANGO_SETTINGS_MODULE=config.settings.production
python manage.py migrate
python manage.py collectstatic --noinput
rsync -a --delete staticfiles/ /var/www/veni/static/
```

Create a superuser for Django staff UI at `/django-admin/` if needed:

```bash
python manage.py createsuperuser
```

---

## 5. Frontend build (first time)

```bash
cd /var/www/veni/repo/frontend
npm ci
VITE_API_BASE_URL=/api/v1 npm run build
rsync -a --delete dist/ /var/www/veni/frontend/dist/
```

---

## 6. Systemd (Gunicorn)

```bash
sudo cp /var/www/veni/repo/infrastructure/systemd/gunicorn.socket /etc/systemd/system/
sudo cp /var/www/veni/repo/infrastructure/systemd/gunicorn.service /etc/systemd/system/
```

Adjust `User`, paths, and `EnvironmentFile` in `gunicorn.service` if your layout differs.

```bash
sudo systemctl daemon-reload
sudo systemctl enable gunicorn.socket gunicorn.service
sudo systemctl start gunicorn.socket
sudo systemctl start gunicorn.service
sudo systemctl status gunicorn.service
```

---

## 7. Nginx

```bash
sudo cp /var/www/veni/repo/infrastructure/nginx/veni.conf /etc/nginx/sites-available/veni.conf
sudo ln -sf /etc/nginx/sites-available/veni.conf /etc/nginx/sites-enabled/veni.conf
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

Update `server_name` in `veni.conf` before going live.

---

## 8. TLS (Certbot)

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

After certificates are issued, update `CSRF_TRUSTED_ORIGINS` and `CORS_ALLOWED_ORIGINS` to `https://…` and redeploy.

---

## 9. Routine deploys

From the repo on the server:

```bash
bash infrastructure/deploy.sh
```

Optional overrides: `VENI_REPO_DIR`, `VENI_DEPLOY_BRANCH`, `VENI_STATIC_DIR`, `VENI_FRONTEND_DIST`.

---

## 10. Verification checklist

- `curl -I https://yourdomain.com/api/v1/health/` → 200 JSON
- Storefront loads; login and checkout work (session + CSRF)
- React admin at `/admin/dashboard` (ADMIN user)
- Django staff at `/django-admin/` (superuser)
- S3 uploads use private bucket presigns only (no public bucket ACL)

---

## Security notes

- Never place `.env` or `.git` under the Nginx `root`; `veni.conf` denies `/.env` and `/.git` as a safeguard.
- `config.settings.production` sets `DEBUG = False` unconditionally and requires database, hosts, CORS/CSRF, and S3 bucket configuration.
- Prefer **IAM roles** on EC2 over long-lived access keys in `.env`.
