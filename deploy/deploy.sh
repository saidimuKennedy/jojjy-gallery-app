#!/usr/bin/env bash
# Deploy jojjy-gallery-app + jojjy-gallery-crm + Postgres + Caddy.
# Run from the deploy/ directory on the server:
#   cp .env.example .env && $EDITOR .env   # set secrets / keys (domains optional)
#   ./deploy.sh
set -euo pipefail
cd "$(dirname "$0")"

COMPOSE=(docker compose -f docker-compose.yml)

# --- Domains ---------------------------------------------------------------
# No DNS needed: when APP_DOMAIN / CRM_DOMAIN are left blank in .env, derive
# <name>.<server-ip>.nip.io from the server's public IP (nip.io resolves any
# <x>.<ip>.nip.io to that IP). Set real domains in .env to opt out.
detect_public_ip() {
  local ip
  for url in "https://ifconfig.me" "https://api.ipify.org" "https://icanhazip.com"; do
    ip=$(curl -4 -fsS --max-time 5 "$url" 2>/dev/null | tr -d '[:space:]') || continue
    if [[ "$ip" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
      echo "$ip"
      return 0
    fi
  done
  hostname -I 2>/dev/null | awk '{print $1}'
}

# Read a value from .env (trimmed), or "" when unset.
env_val() {
  grep -E "^$1=" .env 2>/dev/null | head -1 | cut -d= -f2- | tr -d '[:space:]' || true
}

PUBLIC_IP="${PUBLIC_IP:-$(detect_public_ip)}"
if [[ -z "$PUBLIC_IP" ]]; then
  echo "ERROR: could not detect the server's public IP (set PUBLIC_IP manually)." >&2
  exit 1
fi

resolve_domain() {
  local name="$1" default="$2" val
  val="$(env_val "$name")"
  if [[ -z "$val" || "$val" == *example.com* ]]; then
    echo "$default"
  else
    echo "$val"
  fi
}

APP_DOMAIN="$(resolve_domain APP_DOMAIN "shop.$PUBLIC_IP.nip.io")"
CRM_DOMAIN="$(resolve_domain CRM_DOMAIN "crm.$PUBLIC_IP.nip.io")"
APP_PUBLIC_URL="$(resolve_domain APP_PUBLIC_URL "https://$APP_DOMAIN")"
CRM_PUBLIC_URL="$(resolve_domain CRM_PUBLIC_URL "https://$CRM_DOMAIN")"

export APP_DOMAIN CRM_DOMAIN APP_PUBLIC_URL CRM_PUBLIC_URL

echo "==> Domains:  app=$APP_DOMAIN  crm=$CRM_DOMAIN"
echo "    Paystack webhook will be:  https://$APP_DOMAIN/api/paystack/webhook"

echo "==> Starting Postgres (required first so 'next build' can reach it)…"
"${COMPOSE[@]}" up -d db

echo "==> Waiting for Postgres to be healthy…"
until "${COMPOSE[@]}" exec -T db pg_isready -U "${POSTGRES_USER:-jojjy}" -d "${POSTGRES_DB:-jojjy}" >/dev/null 2>&1; do
  sleep 2
done

echo "==> Running migrations (must happen before building app/crm — next build's"
echo "    static export queries Postgres, so the schema must exist first)…"
# Sequentially: the CRM's migration history is layered on top of the app's
# shared base schema (they even share some migration names), so running them
# concurrently races both against Postgres's migration-lock table. `run --rm`
# (not `up`) also correctly propagates a failing migration's exit code.
"${COMPOSE[@]}" run --rm migrate-app
"${COMPOSE[@]}" run --rm migrate-crm

echo "==> Building app + crm images (next build hits the DB via localhost:${POSTGRES_PORT:-5433})…"
"${COMPOSE[@]}" build app crm

echo "==> Starting the full stack (migrations → app, crm, caddy)…"
"${COMPOSE[@]}" up -d

echo "==> Done. Checking status…"
"${COMPOSE[@]}" ps

echo
echo "Your sites (allow a minute for Caddy to issue TLS certs):"
echo "  app:  https://$APP_DOMAIN"
echo "  crm:  https://$CRM_DOMAIN"
echo "  webhook: https://$APP_DOMAIN/api/paystack/webhook  (add this in Paystack → Settings → Webhooks)"
