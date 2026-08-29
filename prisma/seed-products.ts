/**
 * Idempotent demo data for the public Studio Shop merch section.
 *
 * Products are normally managed in the CRM (localhost:3001/dashboard/merch);
 * this seeds a few so the app's /shop has something purchasable to test.
 *
 *   npx tsx prisma/seed-products.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

function withRelaxedSsl(connectionString: string | undefined) {
  if (!connectionString) return connectionString;
  try {
    const url = new URL(connectionString);
    if (!url.searchParams.has("sslmode")) {
      url.searchParams.set("sslmode", "no-verify");
    }
    return url.toString();
  } catch {
    return connectionString;
  }
}

function isLocalHost(connectionString: string | undefined) {
  if (!connectionString) return false;
  try {
    const { hostname } = new URL(connectionString);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

const isLocal = isLocalHost(process.env.DATABASE_URL);
const pool = new Pool({
  connectionString: isLocal
    ? process.env.DATABASE_URL
    : withRelaxedSsl(process.env.DATABASE_URL),
  max: 1,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const PLACEHOLDER =
  "https://res.cloudinary.com/dq3wkbgts/image/upload/v1750932056/Dawn_km3ucm.jpg";

type SeedVariant = {
  sku: string;
  size?: string;
  color?: string;
  price: number;
  stock: number;
};

type SeedProduct = {
  name: string;
  slug: string;
  description: string;
  category: string;
  imageUrl: string | null;
  variants: SeedVariant[];
};

const PRODUCTS: SeedProduct[] = [
  {
    name: "Jojjy Studio Tote",
    slug: "jojjy-studio-tote",
    description:
      "Heavyweight canvas tote printed with the studio wordmark. Fits a laptop, a sketchbook, and a day out.",
    category: "Tote",
    imageUrl: PLACEHOLDER,
    variants: [
      { sku: "TOTE-NAT-ONE", color: "Natural", price: 25, stock: 12 },
      { sku: "TOTE-BLK-ONE", color: "Black", price: 25, stock: 8 },
    ],
  },
  {
    name: "Dawn Tee",
    slug: "dawn-tee",
    description:
      "Organic cotton tee featuring the painting Dawn. Screen-printed in Nairobi.",
    category: "Apparel",
    imageUrl: PLACEHOLDER,
    variants: [
      { sku: "TEE-S-BLK", size: "S", color: "Black", price: 30, stock: 10 },
      { sku: "TEE-M-BLK", size: "M", color: "Black", price: 30, stock: 15 },
      { sku: "TEE-L-BLK", size: "L", color: "Black", price: 30, stock: 12 },
      { sku: "TEE-XL-BLK", size: "XL", color: "Black", price: 30, stock: 6 },
    ],
  },
  {
    name: "Studio Hoodie",
    slug: "studio-hoodie",
    description:
      "Unisex heavyweight hoodie with a small embroidered studio mark on the chest.",
    category: "Apparel",
    imageUrl: PLACEHOLDER,
    variants: [
      { sku: "HOOD-M-OAT", size: "M", color: "Oat", price: 65, stock: 5 },
      { sku: "HOOD-L-OAT", size: "L", color: "Oat", price: 65, stock: 7 },
      { sku: "HOOD-XL-OAT", size: "XL", color: "Oat", price: 65, stock: 4 },
    ],
  },
];

async function seedProducts() {
  let created = 0;
  let updated = 0;

  for (const product of PRODUCTS) {
    const existing = await prisma.product.findUnique({
      where: { slug: product.slug },
      include: { variants: true },
    });

    const baseData = {
      name: product.name,
      description: product.description,
      category: product.category,
      imageUrl: product.imageUrl,
      isAvailable: true,
    };

    let productId: number;

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: baseData,
      });
      productId = existing.id;
      updated++;
    } else {
      const record = await prisma.product.create({
        data: { ...baseData, slug: product.slug },
        select: { id: true },
      });
      productId = record.id;
      created++;
    }

    for (const variant of product.variants) {
      const existingVariant = existing?.variants.find(
        (v) => v.sku === variant.sku
      );
      if (existingVariant) {
        await prisma.productVariant.update({
          where: { id: existingVariant.id },
          data: {
            size: variant.size ?? null,
            color: variant.color ?? null,
            price: variant.price,
            stock: variant.stock,
          },
        });
      } else {
        await prisma.productVariant.create({
          data: {
            productId,
            sku: variant.sku,
            size: variant.size ?? null,
            color: variant.color ?? null,
            price: variant.price,
            stock: variant.stock,
          },
        });
      }
    }
  }

  console.log(
    `Seeded merch: ${created} created, ${updated} updated (${PRODUCTS.length} products).`
  );
}

seedProducts()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
