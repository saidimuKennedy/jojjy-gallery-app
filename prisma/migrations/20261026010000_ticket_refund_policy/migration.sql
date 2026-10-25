-- Per-tier refund statement shown at checkout (edited in the CRM).
ALTER TABLE "ticket_types" ADD COLUMN "refundPolicy" TEXT;
