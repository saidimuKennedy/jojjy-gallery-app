/**
 * Rhythm na Soul — Braeburn Garden Estate, Sat 31 Oct 2026, 5pm–10pm EAT.
 * Creates the event with its three ticket tiers and one complimentary
 * Early Bird ticket for Waruiru Kennedy. Idempotent.
 *
 *   npx tsx prisma/seed-rhythm-na-soul.ts                 # local database
 *   npx tsx prisma/seed-rhythm-na-soul.ts --allow-remote  # any other database
 *
 * Prices are on the poster in KES; the catalogue stores USD (KES_PER_USD = 130),
 * so they are converted here and charged back in KES at checkout.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { generateTicketCode } from "../lib/orders/ticket-code";
import { kesToUsd } from "../lib/currency";

const dbUrl = process.env.DATABASE_URL ?? "";
const isLocal = /localhost|127\.0\.0\.1/.test(dbUrl);
if (!isLocal && !process.argv.includes("--allow-remote")) {
  throw new Error(
    "DATABASE_URL is not local. Re-run with --allow-remote to write to it."
  );
}

const pool = new Pool({
  connectionString: dbUrl,
  max: 1,
  ssl: isLocal ? undefined : { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const HOLDER = {
  name: "Waruiru Kennedy",
  email: "waruirukennedy2@gmail.com",
};
const REF = "comp-rhythm-na-soul-early-bird-1";

async function main() {
  const event = await prisma.event.upsert({
    where: { slug: "rhythm-na-soul" },
    update: {},
    create: {
      slug: "rhythm-na-soul",
      title: "Rhythm na Soul",
      venue: "Braeburn Garden Estate, Performing Arts Center",
      imageUrl: "/images/events/rhythm-na-soul-art.jpg",
      // Sat 31 Oct 2026, 5pm–10pm East Africa Time (UTC+3)
      startsAt: new Date("2026-10-31T14:00:00Z"),
      endsAt: new Date("2026-10-31T19:00:00Z"),
      status: "PUBLISHED",
      timezone: "Africa/Nairobi",
    },
  });

  async function tier(
    name: string,
    kes: number,
    quantity: number,
    extra: { entryLabel?: string; isPremium?: boolean } = {}
  ) {
    const existing = await prisma.ticketType.findFirst({
      where: { eventId: event.id, name },
    });
    if (existing) return existing;
    return prisma.ticketType.create({
      data: { eventId: event.id, name, price: kesToUsd(kes), quantity, ...extra },
    });
  }
  const earlyBird = await tier("Early Bird", 1500, 100);
  await tier("Gate", 2000, 100);
  await tier("VIP", 3000, 50, { entryLabel: "VIP Access", isPremium: true });

  const user = await prisma.user.findUnique({ where: { email: HOLDER.email } });

  const existingOrder = await prisma.order.findUnique({
    where: { paystackRef: REF },
    include: { tickets: true },
  });
  if (existingOrder?.tickets.length) {
    console.log(`Already issued: ${existingOrder.tickets[0].code}`);
    return;
  }

  const code = generateTicketCode();
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        paystackRef: REF,
        userId: user?.id ?? null,
        status: "PAID",
        paymentStatus: "NOT_REQUIRED",
        amount: 0,
        currency: "USD",
        customerName: HOLDER.name,
        guestEmail: HOLDER.email,
        items: {
          create: {
            itemType: "TICKET",
            ticketTypeId: earlyBird.id,
            quantity: 1,
            unitPrice: 0,
            attendees: [{ name: HOLDER.name, email: HOLDER.email }],
          },
        },
      },
    });
    await tx.ticketType.update({
      where: { id: earlyBird.id },
      data: { quantitySold: { increment: 1 } },
    });
    await tx.ticket.create({
      data: {
        ticketTypeId: earlyBird.id,
        userId: user?.id ?? null,
        orderId: order.id,
        code,
        source: "COMPLIMENTARY",
        holderName: HOLDER.name,
        holderEmail: HOLDER.email,
      },
    });
  });
  console.log(
    `Issued Early Bird ticket ${code} to ${HOLDER.name}. Retrieve with reference "${REF}" + ${HOLDER.email}`
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
