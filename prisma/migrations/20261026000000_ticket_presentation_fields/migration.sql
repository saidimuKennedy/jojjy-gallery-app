-- Ticket presentation fields: event timezone/category/tagline and per-tier
-- entry label + premium flag. All additive; existing rows keep working.
ALTER TABLE "events" ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'Africa/Nairobi';
ALTER TABLE "events" ADD COLUMN "category" TEXT;
ALTER TABLE "events" ADD COLUMN "tagline" TEXT;

ALTER TABLE "ticket_types" ADD COLUMN "entryLabel" TEXT;
ALTER TABLE "ticket_types" ADD COLUMN "isPremium" BOOLEAN NOT NULL DEFAULT false;
