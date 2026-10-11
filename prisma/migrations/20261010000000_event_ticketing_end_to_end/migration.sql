-- Plan 15 — Event & ticketing end to end (shared schema).
-- Guest checkout, ticket inventory reservations, separate payment state, event
-- ticket mode. Forward-only and additive; existing merch/music/artwork orders
-- keep their current `status` semantics.
--
-- Deploy order: `migrate-app` runs before `migrate-crm`, so this migration does
-- NOT reference `crm_users` (the CRM's follow-up migration adds those FKs).

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE "OrderSource" AS ENUM ('ONLINE', 'CRM_COMPLIMENTARY');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "PaymentStatus" AS ENUM (
    'NOT_REQUIRED', 'PENDING', 'SUCCESS', 'FAILED', 'CANCELLED',
    'REFUND_PENDING', 'PARTIALLY_REFUNDED', 'REFUNDED', 'NEEDS_ATTENTION'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "TicketSource" AS ENUM ('PAID', 'COMPLIMENTARY');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "EventTicketMode" AS ENUM ('TICKETED', 'RSVP_ONLY');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ReservationStatus" AS ENUM ('ACTIVE', 'CONSUMED', 'RELEASED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- Event — explicit ticket mode (ticketed vs RSVP-only)
-- ---------------------------------------------------------------------------
ALTER TABLE "events"
  ADD COLUMN IF NOT EXISTS "ticketMode" "EventTicketMode" NOT NULL DEFAULT 'TICKETED';

-- ---------------------------------------------------------------------------
-- TicketType — description, reservation counter, archive marker
-- ---------------------------------------------------------------------------
ALTER TABLE "ticket_types"
  ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "ticket_types"
  ADD COLUMN IF NOT EXISTS "quantityReserved" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ticket_types"
  ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);

-- ---------------------------------------------------------------------------
-- Ticket — nullable owner (guest) + holder snapshot + source + check-in actor
-- ---------------------------------------------------------------------------
ALTER TABLE "tickets" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "tickets"
  ADD COLUMN IF NOT EXISTS "source" "TicketSource" NOT NULL DEFAULT 'PAID';
ALTER TABLE "tickets"
  ADD COLUMN IF NOT EXISTS "holderName" TEXT;
ALTER TABLE "tickets"
  ADD COLUMN IF NOT EXISTS "holderEmail" TEXT;
ALTER TABLE "tickets"
  ADD COLUMN IF NOT EXISTS "checkedInByCrmUserId" TEXT;
CREATE INDEX IF NOT EXISTS "tickets_orderId_idx" ON "tickets"("orderId");
CREATE INDEX IF NOT EXISTS "tickets_status_idx" ON "tickets"("status");

-- ---------------------------------------------------------------------------
-- Order — guest buyer, source, payment state, nullable provider, issuance, retrieval
-- ---------------------------------------------------------------------------
ALTER TABLE "orders" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "orders" ALTER COLUMN "paymentProvider" DROP NOT NULL;
ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "source" "OrderSource" NOT NULL DEFAULT 'ONLINE';
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "guestName" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "guestEmail" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "guestPhone" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "issuedByCrmUserId" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "issueReason" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "retrievalToken" TEXT;
ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "retrievalTokenExpiresAt" TIMESTAMP(3);
CREATE UNIQUE INDEX IF NOT EXISTS "orders_retrievalToken_key" ON "orders"("retrievalToken");
CREATE INDEX IF NOT EXISTS "orders_guestEmail_idx" ON "orders"("guestEmail");
CREATE INDEX IF NOT EXISTS "orders_status_idx" ON "orders"("status");

-- Backfill payment state from the existing lifecycle so existing rows do not
-- falsely read PENDING. Never reinterpret merch/music/artwork statuses.
UPDATE "orders" SET "paymentStatus" = CASE "status"
  WHEN 'PAID' THEN 'SUCCESS'::"PaymentStatus"
  WHEN 'FAILED' THEN 'FAILED'::"PaymentStatus"
  WHEN 'CANCELLED' THEN 'CANCELLED'::"PaymentStatus"
  WHEN 'REFUNDED' THEN 'REFUNDED'::"PaymentStatus"
  ELSE 'PENDING'::"PaymentStatus"
END
WHERE "paymentStatus" = 'PENDING'::"PaymentStatus"
  AND "status" <> 'PENDING'::"OrderStatus";

-- ---------------------------------------------------------------------------
-- OrderItem — per-admission attendee snapshots for ticket items
-- ---------------------------------------------------------------------------
ALTER TABLE "order_items"
  ADD COLUMN IF NOT EXISTS "attendees" JSONB;

-- ---------------------------------------------------------------------------
-- TicketReservation — pre-payment inventory hold with expiry
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "ticket_reservations" (
  "id" TEXT NOT NULL,
  "ticketTypeId" INTEGER NOT NULL,
  "orderId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "status" "ReservationStatus" NOT NULL DEFAULT 'ACTIVE',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "releasedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ticket_reservations_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ticket_reservations_status_expiresAt_idx"
  ON "ticket_reservations"("status", "expiresAt");
CREATE INDEX IF NOT EXISTS "ticket_reservations_orderId_idx"
  ON "ticket_reservations"("orderId");

DO $$ BEGIN
  ALTER TABLE "ticket_reservations"
    ADD CONSTRAINT "ticket_reservations_ticketTypeId_fkey"
    FOREIGN KEY ("ticketTypeId") REFERENCES "ticket_types"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ticket_reservations"
    ADD CONSTRAINT "ticket_reservations_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "orders"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
