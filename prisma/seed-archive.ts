/**
 * Fill the Archive (/gallery) with media entries using real artwork images.
 * Run: npx tsx prisma/seed-archive.ts
 */
import { config } from "dotenv";
config();

import { PrismaClient, MediaBlogEntryType, MediaFileType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { thumbnailFromUrl } from "../lib/cloudinary";

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

const connectionString = withRelaxedSsl(process.env.DATABASE_URL);
if (!connectionString) {
  throw new Error("DATABASE_URL is missing");
}

const pool = new Pool({
  connectionString,
  max: 1,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const IMG = {
  dawn: "https://res.cloudinary.com/dq3wkbgts/image/upload/v1750932056/Dawn_km3ucm.jpg",
  sunshine:
    "https://res.cloudinary.com/dq3wkbgts/image/upload/v1750932044/sunshine_pboqqo.jpg",
  crossing:
    "https://res.cloudinary.com/dq3wkbgts/image/upload/v1750932036/The_Crossing_kbdkjg.jpg",
  tug: "https://res.cloudinary.com/dq3wkbgts/image/upload/v1750932010/Tug_of_war_to9ieg.jpg",
  untitled:
    "https://res.cloudinary.com/dq3wkbgts/image/upload/v1750932000/Untitled_xdhljj.jpg",
  walk: "https://res.cloudinary.com/dq3wkbgts/image/upload/v1750931992/walk_on_water_ekduli.jpg",
  will: "https://res.cloudinary.com/dq3wkbgts/image/upload/v1750931981/will_ywvxte.jpg",
  cycles:
    "https://res.cloudinary.com/dq3wkbgts/image/upload/v1750931901/cycles_k4yv0p.jpg",
  artist:
    "https://res.cloudinary.com/dq3wkbgts/image/upload/v1751641304/joj-artist_vkqvbv.jpg",
};

const thumb = (url: string) => thumbnailFromUrl(url);

async function main() {
  console.log("Seeding Archive (media blog)…");

  await prisma.mediaBlogFile.deleteMany({});
  await prisma.mediaBlogEntry.deleteMany({});
  console.log("Cleared existing archive entries.");

  await prisma.mediaBlogEntry.create({
    data: {
      title: "Dark Clouds Bring Waters",
      shortDesc:
        "A film made during the residency and solo exhibition at Kamene Cultural Centre—dreams as messages from the deep.",
      type: MediaBlogEntryType.VIDEO,
      externalLink: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      thumbnailUrl: thumb(IMG.will),
      duration: "12:40",
      mediaFiles: {
        create: [
          {
            url: IMG.will,
            type: MediaFileType.IMAGE,
            description: "Film still",
            thumbnailUrl: thumb(IMG.will),
            order: 0,
          },
        ],
      },
    },
  });

  await prisma.mediaBlogEntry.create({
    data: {
      title: "Studio Notes: Mark and Void",
      shortDesc:
        "How water, ink, and bleach open a chaotic ground—then charcoal and pastel pull form from the unconscious.",
      type: MediaBlogEntryType.BLOG_POST,
      thumbnailUrl: thumb(IMG.artist),
      content:
        "<p>My studio practice begins with an intuitive process. Water, ink, and bleach create a chaotic foundation. Then charcoal and pastel gradually bring clarity and form.</p><p>I am less interested in illustrating dreams than in listening to them—those cryptic signals from the shadow that insist on being seen.</p><p>Each sheet of paper holds a conversation between destruction and repair.</p>",
    },
  });

  await prisma.mediaBlogEntry.create({
    data: {
      title: "Works on Paper",
      shortDesc:
        "Selected photographs from recent bodies of work—graphite, ink, bleach, and pastel.",
      type: MediaBlogEntryType.IMAGES,
      thumbnailUrl: thumb(IMG.dawn),
      mediaFiles: {
        create: [
          { url: IMG.dawn, type: MediaFileType.IMAGE, description: "Dawn", thumbnailUrl: thumb(IMG.dawn), order: 0 },
          {
            url: IMG.crossing,
            type: MediaFileType.IMAGE,
            description: "The Crossing",
            thumbnailUrl: thumb(IMG.crossing),
            order: 1,
          },
          {
            url: IMG.tug,
            type: MediaFileType.IMAGE,
            description: "Tug of War",
            thumbnailUrl: thumb(IMG.tug),
            order: 2,
          },
          {
            url: IMG.walk,
            type: MediaFileType.IMAGE,
            description: "Walk on Water",
            thumbnailUrl: thumb(IMG.walk),
            order: 3,
          },
          {
            url: IMG.cycles,
            type: MediaFileType.IMAGE,
            description: "Cycles",
            thumbnailUrl: thumb(IMG.cycles),
            order: 4,
          },
        ],
      },
    },
  });

  await prisma.mediaBlogEntry.create({
    data: {
      title: "From Idea to Exhibition",
      shortDesc:
        "A short reflection on bringing Dark Clouds Bring Waters to Kamene Cultural Centre.",
      type: MediaBlogEntryType.BLOG_POST,
      thumbnailUrl: thumb(IMG.sunshine),
      content:
        "<p>An exhibition is not a collection of finished works hung in a room. It is a sequence—an emotional rhythm the visitor walks through.</p><p>For Dark Clouds Bring Waters, that rhythm mattered more than chronology.</p>",
    },
  });

  await prisma.mediaBlogEntry.create({
    data: {
      title: "Will",
      shortDesc: "Graphite and ink—determination held in shadow and light.",
      type: MediaBlogEntryType.IMAGES,
      thumbnailUrl: thumb(IMG.will),
      mediaFiles: {
        create: [
          {
            url: IMG.will,
            type: MediaFileType.IMAGE,
            description: "Will, 2022",
            thumbnailUrl: thumb(IMG.will),
            order: 0,
          },
          {
            url: IMG.untitled,
            type: MediaFileType.IMAGE,
            description: "Related study",
            thumbnailUrl: thumb(IMG.untitled),
            order: 1,
          },
        ],
      },
    },
  });

  await prisma.mediaBlogEntry.create({
    data: {
      title: "Listening to the Work",
      shortDesc:
        "A brief recorded reflection on process, dreams, and materials.",
      type: MediaBlogEntryType.AUDIO,
      thumbnailUrl: thumb(IMG.crossing),
      duration: "08:12",
      externalLink: "https://example.com",
      mediaFiles: {
        create: [
          {
            url: IMG.crossing,
            type: MediaFileType.IMAGE,
            description: "Cover",
            thumbnailUrl: thumb(IMG.crossing),
            order: 0,
          },
        ],
      },
    },
  });

  await prisma.mediaBlogEntry.create({
    data: {
      title: "Featured in Business Daily",
      shortDesc:
        "A profile on process, materials, and the alchemical approach to mark-making.",
      type: MediaBlogEntryType.EXTERNAL_LINK,
      thumbnailUrl: thumb(IMG.tug),
      externalLink: "https://www.businessdailyafrica.com/",
    },
  });

  const count = await prisma.mediaBlogEntry.count();
  console.log(`Archive seeded with ${count} entries.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
