-- Music catalogue prices: store USD (convert legacy KES rows at 130 KES = 1 USD).

ALTER TABLE "music_access_policies" ALTER COLUMN "currency" SET DEFAULT 'USD';
ALTER TABLE "music_membership_plans" ALTER COLUMN "currency" SET DEFAULT 'USD';

UPDATE "music_access_policies"
SET
  "price" = ROUND(("price" / 130.0)::numeric, 2),
  "currency" = 'USD'
WHERE "currency" = 'KES' AND "price" IS NOT NULL;

UPDATE "music_membership_plans"
SET
  "price" = ROUND(("price" / 130.0)::numeric, 2),
  "currency" = 'USD'
WHERE "currency" = 'KES';

ALTER TABLE "orders" ALTER COLUMN "currency" SET DEFAULT 'USD';
