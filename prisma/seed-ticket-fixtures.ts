/**
 * Local-only fixtures for exercising the EventTicket UI: one event with an
 * image + two tiers (standard and premium), one event without an image, and a
 * guest order holding tickets in every lifecycle state.
 *
 *   npx tsx prisma/seed-ticket-fixtures.ts
 *
 * Retrieve at /tickets/retrieve with reference "fixture-order" and email
 * "fixture.guest@example.com". Refuses to run against non-local databases.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const dbUrl = process.env.DATABASE_URL ?? "";
if (!/localhost|127\.0\.0\.1/.test(dbUrl)) {
  throw new Error("seed-ticket-fixtures only runs against a local database.");
}

const pool = new Pool({ connectionString: dbUrl, max: 1 });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const IMAGE =
  "https://res.cloudinary.com/dq3wkbgts/image/upload/v1750932056/Dawn_km3ucm.jpg";

async function main() {
  const live = await prisma.event.upsert({
    where: { slug: "fixture-jenga-live" },
    update: {},
    create: {
      slug: "fixture-jenga-live",
      title: "Jenga Live",
      description: "Fixture event for ticket UI checks.",
      venue: "The JENGA Studio, Nairobi, Kenya",
      imageUrl: IMAGE,
      startsAt: new Date("2026-12-12T16:00:00Z"),
      endsAt: new Date("2026-12-12T20:00:00Z"),
      status: "PUBLISHED",
      category: "Live event",
      tagline: "People. Art. Sound. Together.",
    },
  });
  const quiet = await prisma.event.upsert({
    where: { slug: "fixture-no-image" },
    update: {},
    create: {
      slug: "fixture-no-image",
      title: "A Very Long Fixture Event Title For Wrapping Checks",
      venue: "Private viewing room, Kilimani",
      startsAt: new Date("2026-11-20T14:30:00Z"),
      status: "PUBLISHED",
      timezone: "Europe/London",
    },
  });

  async function tier(
    eventId: number,
    name: string,
    price: number,
    extra: { entryLabel?: string; isPremium?: boolean } = {}
  ) {
    const found = await prisma.ticketType.findFirst({
      where: { eventId, name },
    });
    if (found) return found;
    return prisma.ticketType.create({
      data: { eventId, name, price, quantity: 100, ...extra },
    });
  }
  const ga = await tier(live.id, "General Admission", 1300, {
    entryLabel: "General Access",
  });
  const vip = await tier(live.id, "VIP", 5000, {
    entryLabel: "VIP Access",
    isPremium: true,
  });
  const plain = await tier(quiet.id, "Standard", 0);

  const order = await prisma.order.upsert({
    where: { paystackRef: "fixture-order" },
    update: {},
    create: {
      paystackRef: "fixture-order",
      status: "PAID",
      paymentStatus: "SUCCESS",
      amount: 9600,
      currency: "KES",
      customerName: "Fixture Guest",
      guestEmail: "fixture.guest@example.com",
    },
  });

  const tickets: Array<{
    code: string;
    ticketTypeId: number;
    status: "VALID" | "CHECKED_IN" | "REFUNDED" | "CANCELLED";
    holderName: string;
    checkedInAt?: Date;
  }> = [
    { code: "FIX-GA-VALID", ticketTypeId: ga.id, status: "VALID", holderName: "Kennedy" },
    { code: "FIX-VIP-VALID", ticketTypeId: vip.id, status: "VALID", holderName: "Wairu" },
    {
      code: "FIX-GA-USED",
      ticketTypeId: ga.id,
      status: "CHECKED_IN",
      holderName: "Njeri",
      checkedInAt: new Date("2026-12-12T16:20:00Z"),
    },
    { code: "FIX-GA-REFUNDED", ticketTypeId: ga.id, status: "REFUNDED", holderName: "Otieno" },
    { code: "FIX-NOIMG-VALID", ticketTypeId: plain.id, status: "VALID", holderName: "Amina" },
  ];
  for (const t of tickets) {
    await prisma.ticket.upsert({
      where: { code: t.code },
      update: { status: t.status, checkedInAt: t.checkedInAt ?? null },
      create: { ...t, orderId: order.id },
    });
  }
  console.log(
    `Fixtures ready. Retrieve with reference "fixture-order" + fixture.guest@example.com`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
