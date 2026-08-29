FROM node:24-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Standalone stage to run `prisma migrate deploy` without needing `next build`
# (which needs a migrated DB to run getStaticProps) — breaks the chicken-and-egg
# between "build the image" and "migrate the DB the build queries".
FROM node:24-slim AS migrator
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.js ./prisma.config.js
CMD ["npx", "prisma", "migrate", "deploy"]

FROM node:24-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# next build runs getStaticProps (shop, gallery) that query Postgres, so the
# build needs a reachable, already-migrated DB. Pass via build args (see
# deploy/.env.example) — run the `migrator` stage/service first.
ARG DATABASE_URL
ARG DIRECT_URL
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_CURRENCY
ARG NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
ARG NEXT_PUBLIC_ARTIST_WHATSAPP_NUMBER
ENV DATABASE_URL=$DATABASE_URL \
    DIRECT_URL=$DIRECT_URL \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_CURRENCY=$NEXT_PUBLIC_CURRENCY \
    NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=$NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY \
    NEXT_PUBLIC_ARTIST_WHATSAPP_NUMBER=$NEXT_PUBLIC_ARTIST_WHATSAPP_NUMBER \
    NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate && npm run build

FROM node:24-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    NEXT_TELEMETRY_DISABLED=1
RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 nextjs
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.js ./prisma.config.js
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
USER nextjs
EXPOSE 3000
CMD ["node_modules/.bin/next", "start"]
