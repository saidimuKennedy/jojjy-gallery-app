#!/usr/bin/env bash
# Deploy jojjy-gallery-app + jojjy-gallery-crm + Postgres + Caddy.
# Run from the deploy/ directory on the server:
#   cp .env.example .env && $EDITOR .env   # fill in domains, secrets, keys
#   ./deploy.sh
set -euo pipefail
cd "$(dirname "$0")"

COMPOSE="docker compose -f docker-compose.yml"

echo "==> Starting Postgres (required first so `next build` can reach it)…"
"$COMPOSE" up -d db

echo "==> Waiting for Postgres to be healthy…"
until "$COMPOSE" exec -T db pg_isready -U "${POSTGRES_USER:-jojjy}" -d "${POSTGRES_DB:-jojjy}" >/dev/null 2>&1; do
  sleep 2
done

echo "==> Building app + crm images (next build hits the DB via localhost:${POSTGRES_PORT:-5433})…"
"$COMPOSE" build app crm

echo "==> Starting the full stack (migrations → app, crm, caddy)…"
"$COMPOSE" up -d

echo "==> Done. Checking status…"
"$COMPOSE" ps

echo
echo "Caddy will provision TLS automatically once DNS points at this server:"
grep -E "APP_DOMAIN|CRM_DOMAIN" .env 2>/dev/null || true
