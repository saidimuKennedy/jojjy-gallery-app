# Docker Deployment — app + CRM + Postgres + Caddy

Containerizes `jojjy-gallery-app` and `jojjy-gallery-crm` (they share one
Postgres) behind a Caddy reverse proxy with automatic HTTPS. This is the path
to let Paystack reach the app's webhook and checkout callbacks from a real
server instead of the sandbox.

## Flow (actions)

1. **On a Docker server** (VPS): clone both repos side by side:

   ```
   ~/srv/jojjy-gallery-app
   ~/srv/jojjy-gallery-crm   # sibling — compose build context expects this
   ```

2. **DNS**: point `A` records at the server for both domains, e.g.
   `shop.example.com` and `crm.example.com`. Keep the server's ports 80/443
   open (Caddy binds them and issues Let's Encrypt certs).

3. **Configure** `deploy/.env` (copy from `deploy/.env.example`):
   - `APP_DOMAIN` / `CRM_DOMAIN` / `APP_PUBLIC_URL` / `CRM_PUBLIC_URL`
   - `POSTGRES_PASSWORD`, `NEXTAUTH_SECRET` (`openssl rand -base64 32`)
   - `PAYSTACK_SECRET_KEY`, `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`
   - `APP_DATABASE_URL` / `APP_DIRECT_URL` (host `db`, inside the network)
   - `BUILD_DATABASE_URL` / `BUILD_DIRECT_URL` (host `localhost:$POSTGRES_PORT`,
     used by `next build` because `/shop`, `/gallery` pages run `getStaticProps`
     against the DB)

4. **Deploy** (from `deploy/`):

   ```
   cp .env.example .env && $EDITOR .env
   ./deploy.sh
   ```

   `deploy.sh` does, in order:
   - `docker compose up -d db` (Postgres must be up **before** the image build)
   - wait for `pg_isready`
   - `docker compose build app crm` (build network is `host`, so `next build`
     reaches Postgres via the published `localhost:5433`)
   - `docker compose up -d` → runs one-shot migrations, then app, crm, caddy

5. **Migrations**: `migrate-app` runs the app's full Prisma history;
   `migrate-crm` runs only its staff-auth migration (`prisma migrate deploy`
   skips migrations whose name is already recorded). Both are idempotent.

6. **Paystack dashboard** → Settings → Webhooks:
   - URL: `https://$APP_DOMAIN/api/paystack/webhook`
   - The checkout callback URL is already wired (`paystackCallbackUrl` →
     `/shop/confirmation?reference=…`).

7. **Seed / manage content**: create products/events in the CRM at
   `https://$CRM_DOMAIN/dashboard/merch`, or run the seed inside the app
   container once:
   ```
   docker compose -f deploy/docker-compose.yml run --rm migrate-app \
     npx tsx prisma/seed-products.ts
   ```

8. **Verify end-to-end**: buy merch on `https://$APP_DOMAIN/shop` → Paystack →
   return → order PAID, stock decremented, webhook acknowledged.

## Local validation (no server needed)

From the repo root with Docker available, the stack can be smoke-tested against
a throwaway database (see the `deploy/` compose file; set `POSTGRES_PORT` to an
unused port if the local dev Postgres already uses 5433).

## Notes / caveats

- `next build` requires a reachable DB (ISR pages). On first deploy the compose
  `db` service is started first, so `./deploy.sh` ordering is mandatory.
- Caddy needs ports 80 (ACME HTTP-01 challenge) and 443 open, plus valid DNS.
- Secrets live in `deploy/.env` — do not commit it.
- `NEXT_PUBLIC_*` values are inlined at build time; changing them requires a
  rebuild (`./deploy.sh`).
