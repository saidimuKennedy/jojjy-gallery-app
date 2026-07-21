/**
 * Demo fan accounts for music QA.
 *
 *   npx tsx prisma/seed-music-demo-users.ts
 *   # or: npm run prisma:seed-music-demo-users
 *
 * Requires seed-music.ts to have run first.
 */
import "dotenv/config";
import { PrismaClient, UserRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { hashPassword } from "../lib/auth";

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

const DEMO_PASSWORD = "demo123456";

const ACCOUNTS = [
  {
    username: "studio_member",
    email: "studio.member@demo.jojjy",
    label: "Studio member (active pass, founding)",
  },
  {
    username: "music_collector",
    email: "music.collector@demo.jojjy",
    label: "Paid — owns Sunshine — Live",
  },
  {
    username: "music_listener",
    email: "music.listener@demo.jojjy",
    label: "Free listener — no purchases",
  },
] as const;

async function main() {
  const passwordHash = await hashPassword(DEMO_PASSWORD);

  const sunshine = await prisma.release.findUnique({
    where: { slug: "sunshine-live" },
  });
  if (!sunshine) {
    throw new Error("Run prisma:seed-music first (sunshine-live missing).");
  }

  const plan = await prisma.membershipPlan.findFirst({
    where: { active: true },
    orderBy: { price: "asc" },
  });
  if (!plan) {
    throw new Error("Run prisma:seed-music first (no membership plan).");
  }

  for (const acct of ACCOUNTS) {
    const user = await prisma.user.upsert({
      where: { email: acct.email },
      update: {
        username: acct.username,
        passwordHash,
        role: UserRole.USER,
      },
      create: {
        username: acct.username,
        email: acct.email,
        passwordHash,
        role: UserRole.USER,
      },
    });

    await prisma.releaseUnlock.deleteMany({ where: { userId: user.id } });
    await prisma.membership.deleteMany({ where: { userId: user.id } });
    await prisma.paidPlayQuota.deleteMany({ where: { userId: user.id } });

    if (acct.email === "studio.member@demo.jojjy") {
      const expiresAt = new Date();
      expiresAt.setUTCDate(expiresAt.getUTCDate() + 90);
      await prisma.membership.create({
        data: {
          userId: user.id,
          membershipPlanId: plan.id,
          expiresAt,
          status: "ACTIVE",
          isFounding: true,
        },
      });
    }

    if (acct.email === "music.collector@demo.jojjy") {
      await prisma.releaseUnlock.create({
        data: {
          userId: user.id,
          releaseId: sunshine.id,
          source: "CRM_MANUAL",
        },
      });
    }

    console.log(`✓ ${acct.label}`);
    console.log(`  email: ${acct.email}`);
    console.log(`  password: ${DEMO_PASSWORD}`);
  }

  console.log("\nDemo accounts ready. Sign in at /login");
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
