/**
 * Idempotent demo data for /music.
 *
 *   npx tsx prisma/seed-music.ts
 *   # or: npm run prisma:seed-music
 *
 * Catalogue prices are stored in USD. Paystack charges KES at checkout (see KES_PER_USD).
 *
 * Track `storageKey` values are public https demo MP3s (dev/seed only).
 * Production uploads should use Cloudinary authenticated public_ids.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { DEFAULT_STUDIO_PAGE } from "../lib/music/studio-defaults";

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
};

/** Royalty-free demo streams for local/seed playback */
const AUDIO = {
  one: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  two: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  three: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  four: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
};

async function upsertRelease(params: {
  slug: string;
  title: string;
  description: string;
  artistNotes?: string | null;
  studioNotes?: string | null;
  coverImage: string;
  releaseType: "SINGLE" | "EP" | "ALBUM" | "LIVE_SESSION" | "ACOUSTIC_SESSION";
  genre: string;
  accessMode: "FREE" | "PAID" | "MEMBERS_ONLY";
  price?: number | null;
  tracks: { title: string; storageKey: string; duration: number }[];
}) {
  const release = await prisma.release.upsert({
    where: { slug: params.slug },
    update: {
      title: params.title,
      description: params.description,
      artistNotes: params.artistNotes ?? null,
      studioNotes: params.studioNotes ?? null,
      coverImage: params.coverImage,
      artistName: "Njenga Ngugi",
      releaseType: params.releaseType,
      genre: params.genre,
      publishStatus: "PUBLISHED",
      publishAt: new Date(),
      releaseDate: new Date(),
      explicit: false,
    },
    create: {
      slug: params.slug,
      title: params.title,
      description: params.description,
      artistNotes: params.artistNotes ?? null,
      studioNotes: params.studioNotes ?? null,
      coverImage: params.coverImage,
      artistName: "Njenga Ngugi",
      releaseType: params.releaseType,
      genre: params.genre,
      publishStatus: "PUBLISHED",
      publishAt: new Date(),
      releaseDate: new Date(),
      explicit: false,
    },
  });

  await prisma.accessPolicy.upsert({
    where: { releaseId: release.id },
    update: {
      accessMode: params.accessMode,
      price:
        params.accessMode === "PAID" && params.price != null
          ? params.price
          : null,
      currency: "USD",
      paidPlayLimit: 3,
    },
    create: {
      releaseId: release.id,
      accessMode: params.accessMode,
      price:
        params.accessMode === "PAID" && params.price != null
          ? params.price
          : null,
      currency: "USD",
      paidPlayLimit: 3,
    },
  });

  await prisma.track.deleteMany({ where: { releaseId: release.id } });
  await prisma.track.createMany({
    data: params.tracks.map((t, i) => ({
      releaseId: release.id,
      title: t.title,
      trackNumber: i + 1,
      storageKey: t.storageKey,
      duration: t.duration,
    })),
  });

  return release;
}

async function upsertPlan(params: {
  name: string;
  description: string;
  price: number;
  durationDays: number;
}) {
  const existing = await prisma.membershipPlan.findFirst({
    where: { name: params.name },
  });
  if (existing) {
    return prisma.membershipPlan.update({
      where: { id: existing.id },
      data: {
        description: params.description,
        price: params.price,
        currency: "USD",
        durationDays: params.durationDays,
        active: true,
      },
    });
  }
  return prisma.membershipPlan.create({
    data: {
      name: params.name,
      description: params.description,
      price: params.price,
      currency: "USD",
      durationDays: params.durationDays,
      active: true,
    },
  });
}

async function main() {
  await upsertPlan({
    name: "30 days in the Studio",
    description: "Member exclusives and early listens for a month.",
    price: 12,
    durationDays: 30,
  });
  await upsertPlan({
    name: "90 days in the Studio",
    description: "Quarter of studio access.",
    price: 27,
    durationDays: 90,
  });

  await prisma.studioPageContent.upsert({
    where: { id: 1 },
    update: {
      heroTitle: DEFAULT_STUDIO_PAGE.heroTitle,
      heroSubtitle: DEFAULT_STUDIO_PAGE.heroSubtitle,
      relationshipLead: DEFAULT_STUDIO_PAGE.relationshipLead,
      journeySteps: DEFAULT_STUDIO_PAGE.journeySteps,
      faq: DEFAULT_STUDIO_PAGE.faq,
    },
    create: {
      id: 1,
      heroTitle: DEFAULT_STUDIO_PAGE.heroTitle,
      heroSubtitle: DEFAULT_STUDIO_PAGE.heroSubtitle,
      relationshipLead: DEFAULT_STUDIO_PAGE.relationshipLead,
      journeySteps: DEFAULT_STUDIO_PAGE.journeySteps,
      faq: DEFAULT_STUDIO_PAGE.faq,
    },
  });

  await upsertRelease({
    slug: "dawn-theme",
    title: "Dawn Theme",
    description:
      "A free listen from the studio — open the morning with this single.",
    coverImage: IMG.dawn,
    releaseType: "SINGLE",
    genre: "Ambient",
    accessMode: "FREE",
    tracks: [
      { title: "Dawn Theme", storageKey: AUDIO.one, duration: 372 },
    ],
  });

  await upsertRelease({
    slug: "crossing-session",
    title: "Crossing Session",
    description:
      "Two pieces from an evening session. Three free plays, then unlock.",
    artistNotes:
      "I wrote the crossing piece after a long walk through Nairobi at dusk — the city felt like it was holding its breath.",
    coverImage: IMG.crossing,
    releaseType: "EP",
    genre: "Jazz",
    accessMode: "PAID",
    price: 6,
    tracks: [
      { title: "The Crossing", storageKey: AUDIO.two, duration: 420 },
      { title: "After Light", storageKey: AUDIO.three, duration: 355 },
    ],
  });

  await upsertRelease({
    slug: "members-tug",
    title: "Tug of War (Members)",
    description:
      "Studio exclusive — early cut ahead of a wider release.",
    artistNotes:
      "A sketch that turned into something I couldn't leave behind. Shared with the Studio first.",
    studioNotes:
      "Recorded in one take after midnight. The vocal you hear is the first pass — I kept it raw on purpose.",
    coverImage: IMG.tug,
    releaseType: "SINGLE",
    genre: "Experimental",
    accessMode: "MEMBERS_ONLY",
    tracks: [
      { title: "Tug of War", storageKey: AUDIO.four, duration: 390 },
    ],
  });

  await upsertRelease({
    slug: "sunshine-live",
    title: "Sunshine — Live",
    description: "Live session document. Paid unlock after the tease plays.",
    artistNotes:
      "Sunshine was a room full of friends and one microphone. This is that evening, imperfect and alive.",
    coverImage: IMG.sunshine,
    releaseType: "LIVE_SESSION",
    genre: "Live",
    accessMode: "PAID",
    price: 9,
    tracks: [
      { title: "Sunshine (Live)", storageKey: AUDIO.one, duration: 372 },
      { title: "Encore sketch", storageKey: AUDIO.two, duration: 280 },
    ],
  });

  const count = await prisma.release.count({
    where: { publishStatus: "PUBLISHED" },
  });
  const plans = await prisma.membershipPlan.count({ where: { active: true } });
  console.log(
    `Seeded music: ${count} published release(s), ${plans} active plan(s).`
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
