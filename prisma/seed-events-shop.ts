/**
 * Idempotent demo data for /events. Studio Shop uses real artworks + prices
 * (no separate product seed).
 *
 *   npx tsx prisma/seed-events-shop.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

function withRelaxedSsl(connectionString: string | undefined) {
  if (!connectionString) return connectionString;
  try {
    const url = new URL(connectionString);
    url.searchParams.set("sslmode", "no-verify");
    return url.toString();
  } catch {
    return connectionString;
  }
}

const pool = new Pool({
  connectionString: withRelaxedSsl(process.env.DATABASE_URL),
  max: 1,
  ssl: { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const IMG = {
  dawn: "https://res.cloudinary.com/dq3wkbgts/image/upload/v1750932056/Dawn_km3ucm.jpg",
  sunshine:
    "https://res.cloudinary.com/dq3wkbgts/image/upload/v1750932044/sunshine_pboqqo.jpg",
  crossing:
    "https://res.cloudinary.com/dq3wkbgts/image/upload/v1750932036/The_Crossing_kbdkjg.jpg",
  tug: "https://res.cloudinary.com/dq3wkbgts/image/upload/v1750932010/Tug_of_war_to9ieg.jpg",
  walk: "https://res.cloudinary.com/dq3wkbgts/image/upload/v1750931992/walk_on_water_ekduli.jpg",
};

async function seedEvents() {
  const upcomingStarts = new Date();
  upcomingStarts.setDate(upcomingStarts.getDate() + 21);
  upcomingStarts.setHours(18, 0, 0, 0);
  const upcomingEnds = new Date(upcomingStarts);
  upcomingEnds.setHours(21, 0, 0, 0);
  const artistTalk = new Date(upcomingStarts);
  artistTalk.setHours(19, 0, 0, 0);

  const pastStarts = new Date();
  pastStarts.setMonth(pastStarts.getMonth() - 2);
  pastStarts.setHours(17, 0, 0, 0);
  const pastEnds = new Date(pastStarts);
  pastEnds.setDate(pastEnds.getDate() + 14);

  const opening = await prisma.event.upsert({
    where: { slug: "studio-opening-nairobi" },
    update: {
      title: "Studio Opening — Nairobi",
      description:
        "An evening in the studio: new works on the wall, a short artist talk, and time to meet collectors and friends. Limited tickets.",
      venue: "Njenga Ngugi Studio, Westlands, Nairobi",
      imageUrl: IMG.dawn,
      startsAt: upcomingStarts,
      endsAt: upcomingEnds,
      status: "PUBLISHED",
      directions:
        "From Waiyaki Way, turn onto Ring Road Westlands. Studio entrance is marked on the ground floor courtyard.",
      openingHours: "Doors 6:00pm · Talk 7:00pm · Close 9:00pm",
      artistTalkAt: artistTalk,
    },
    create: {
      title: "Studio Opening — Nairobi",
      slug: "studio-opening-nairobi",
      description:
        "An evening in the studio: new works on the wall, a short artist talk, and time to meet collectors and friends. Limited tickets.",
      venue: "Njenga Ngugi Studio, Westlands, Nairobi",
      imageUrl: IMG.dawn,
      startsAt: upcomingStarts,
      endsAt: upcomingEnds,
      status: "PUBLISHED",
      directions:
        "From Waiyaki Way, turn onto Ring Road Westlands. Studio entrance is marked on the ground floor courtyard.",
      openingHours: "Doors 6:00pm · Talk 7:00pm · Close 9:00pm",
      artistTalkAt: artistTalk,
    },
  });

  await prisma.ticketType.deleteMany({ where: { eventId: opening.id } });
  await prisma.ticketType.createMany({
    data: [
      {
        eventId: opening.id,
        name: "General Admission",
        price: 15,
        quantity: 80,
        quantitySold: 56,
        salesStart: new Date(),
        salesEnd: upcomingStarts,
      },
      {
        eventId: opening.id,
        name: "Patron",
        price: 50,
        quantity: 20,
        quantitySold: 14,
        salesStart: new Date(),
        salesEnd: upcomingStarts,
      },
    ],
  });

  // Atmosphere stills for the upcoming opening (installation / evening energy)
  await prisma.eventMediaFile.deleteMany({ where: { eventId: opening.id } });
  await prisma.eventMediaFile.createMany({
    data: [
      {
        eventId: opening.id,
        url: IMG.crossing,
        type: "IMAGE",
        description: "Works in the room",
        order: 0,
      },
      {
        eventId: opening.id,
        url: IMG.tug,
        type: "IMAGE",
        description: "Conversation at the opening",
        order: 1,
      },
      {
        eventId: opening.id,
        url: IMG.walk,
        type: "IMAGE",
        description: "Looking",
        order: 2,
      },
    ],
  });

  const archive = await prisma.event.upsert({
    where: { slug: "light-series-exhibition-2026" },
    update: {
      title: "The Light Series — Exhibition",
      description:
        "A two-week hang of The Light Series at a private Nairobi space. Documentation and press below.",
      venue: "Private viewing room, Kilimani",
      imageUrl: IMG.sunshine,
      startsAt: pastStarts,
      endsAt: pastEnds,
      status: "COMPLETED",
      directions: "Invite-only venue; archive page is public.",
      openingHours: "By appointment during the run",
      artistTalkAt: null,
    },
    create: {
      title: "The Light Series — Exhibition",
      slug: "light-series-exhibition-2026",
      description:
        "A two-week hang of The Light Series at a private Nairobi space. Documentation and press below.",
      venue: "Private viewing room, Kilimani",
      imageUrl: IMG.sunshine,
      startsAt: pastStarts,
      endsAt: pastEnds,
      status: "COMPLETED",
      directions: "Invite-only venue; archive page is public.",
      openingHours: "By appointment during the run",
    },
  });

  await prisma.eventMediaFile.deleteMany({ where: { eventId: archive.id } });
  await prisma.eventMediaFile.createMany({
    data: [
      {
        eventId: archive.id,
        url: IMG.crossing,
        type: "IMAGE",
        description: "Opening night — north wall",
        order: 0,
      },
      {
        eventId: archive.id,
        url: IMG.tug,
        type: "IMAGE",
        description: "Collectors in conversation",
        order: 1,
      },
      {
        eventId: archive.id,
        url: IMG.walk,
        type: "IMAGE",
        description: "Detail — Walk on Water",
        order: 2,
      },
    ],
  });

  await prisma.pressMention.deleteMany({ where: { eventId: archive.id } });
  await prisma.pressMention.createMany({
    data: [
      {
        eventId: archive.id,
        title: "Njenga Ngugi’s Light Series finds a quiet Nairobi home",
        url: "https://example.com/press/light-series",
        publication: "The East African (demo)",
        publishedAt: pastEnds,
      },
      {
        eventId: archive.id,
        title: "Studio notes: hanging The Light Series",
        url: "https://example.com/press/studio-notes",
        publication: "Artist Journal (demo)",
        publishedAt: pastStarts,
      },
    ],
  });

  console.log(`Events: ${opening.slug}, ${archive.slug}`);
}

async function main() {
  console.log("Seeding Events demos (shop uses live artworks)…");
  await seedEvents();
  console.log("Done.");
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
