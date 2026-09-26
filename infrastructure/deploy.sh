#!/usr/bin/env bash
# Veni production deploy — run on EC2 as the ubuntu user from the repo root.
set -euo pipefail

REPO_DIR="${VENI_REPO_DIR:-/var/www/veni/repo}"
BACKEND_DIR="${VENI_BACKEND_DIR:-${REPO_DIR}/backend}"
FRONTEND_DIST="${VENI_FRONTEND_DIST:-/var/www/veni/frontend/dist}"
STATIC_DIR="${VENI_STATIC_DIR:-/var/www/veni/static}"
VENV="${VENI_VENV:-${BACKEND_DIR}/.venv}"
BRANCH="${VENI_DEPLOY_BRANCH:-main}"

echo "==> Pulling ${BRANCH} in ${REPO_DIR}"
cd "${REPO_DIR}"
git fetch origin
git checkout "${BRANCH}"
git pull origin "${BRANCH}"

echo "==> Backend dependencies"
if [[ ! -d "${VENV}" ]]; then
  python3 -m venv "${VENV}"
fi
# shellcheck source=/dev/null
source "${VENV}/bin/activate"
pip install -r "${REPO_DIR}/backend/requirements.txt"

echo "==> Django migrate & collectstatic"
export DJANGO_SETTINGS_MODULE="${DJANGO_SETTINGS_MODULE:-config.settings.production}"
if [[ ! -f "${BACKEND_DIR}/.env" ]]; then
  echo "Missing ${BACKEND_DIR}/.env — copy from infrastructure/.env.production.example" >&2
  exit 1
fi
set -a
# shellcheck source=/dev/null
source "${BACKEND_DIR}/.env"
set +a
cd "${BACKEND_DIR}"
python manage.py migrate --noinput
python manage.py collectstatic --noinput
rsync -a --delete "${BACKEND_DIR}/staticfiles/" "${STATIC_DIR}/"

echo "==> Frontend build"
cd "${REPO_DIR}/frontend"
npm ci
npm run build
rsync -a --delete "${REPO_DIR}/frontend/dist/" "${FRONTEND_DIST}/"

echo "==> Restart services"
sudo systemctl restart gunicorn
sudo systemctl reload nginx

echo "==> Deploy complete"
