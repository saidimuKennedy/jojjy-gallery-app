import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

declare global {
  var prisma: PrismaClient | undefined;
}

const connectionString = process.env.DATABASE_URL;

let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  const pool = new Pool({
    connectionString,
    max: 1,
  });
  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });
} else {
  if (!global.prisma) {
    const pool = new Pool({
      connectionString,
      max: 1,
    });
    const adapter = new PrismaPg(pool);
    global.prisma = new PrismaClient({ adapter });
  }
  prisma = global.prisma;
}

export default prisma;