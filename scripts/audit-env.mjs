#!/usr/bin/env node
/**
 * Environment variable audit for jojjy-gallery-app.
 * Run: npm run audit:env
 * Optional: vercel env pull .env.vercel-audit --environment production
 *           then re-run to compare production keys (values stay hidden).
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** @type {Record<string, { category: string, required: "always"|"production"|"feature", feature?: string, usedBy: string[] }>} */
const ENV_MANIFEST = {
  DATABASE_URL: {
    category: "Database",
    required: "always",
    usedBy: ["lib/prisma.ts", "seed scripts"],
  },
  DIRECT_URL: {
    category: "Database",
    required: "always",
    usedBy: ["prisma.config.js (migrations CLI)"],
  },
  NEXTAUTH_SECRET: {
    category: "Auth",
    required: "production",
    usedBy: [
      "pages/api/auth/[...nextauth].ts",
      "lib/music/playback.ts (fallback)",
    ],
  },
  NEXTAUTH_URL: {
    category: "Auth",
    required: "production",
    usedBy: [
      "pages/api/auth/[...nextauth].ts",
      "pages/api/payment/checkout.ts (M-Pesa callback base)",
    ],
  },
  NEXT_PUBLIC_CURRENCY: {
    category: "Display",
    required: "feature",
    feature: "Price labels (defaults to USD if unset)",
    usedBy: ["shop", "events", "account", "orders/checkout"],
  },
  NEXT_PUBLIC_ARTIST_WHATSAPP_NUMBER: {
    category: "Display",
    required: "feature",
    feature: "WhatsApp inquiry button on artwork pages",
    usedBy: ["pages/artworks/[id].tsx"],
  },
  CLOUDINARY_CLOUD_NAME: {
    category: "Media",
    required: "feature",
    feature: "Signed music streams (non-URL storageKey) + uploads",
    usedBy: ["lib/music/playback.ts"],
  },
  CLOUDINARY_API_KEY: {
    category: "Media",
    required: "feature",
    feature: "Signed music streams (non-URL storageKey) + uploads",
    usedBy: ["lib/music/playback.ts"],
  },
  CLOUDINARY_API_SECRET: {
    category: "Media",
    required: "feature",
    feature: "Signed music streams (non-URL storageKey) + uploads",
    usedBy: ["lib/music/playback.ts"],
  },
  MUSIC_PLAY_SECRET: {
    category: "Music",
    required: "feature",
    feature: "Optional dedicated play-token secret (falls back to NEXTAUTH_SECRET)",
    usedBy: ["lib/music/playback.ts"],
  },
  MPESA_CONSUMER_KEY: {
    category: "Payments",
    required: "feature",
    feature: "Artwork cart M-Pesa checkout",
    usedBy: ["pages/api/mpesa/stkpush.ts"],
  },
  MPESA_CONSUMER_SECRET: {
    category: "Payments",
    required: "feature",
    feature: "Artwork cart M-Pesa checkout",
    usedBy: ["pages/api/mpesa/stkpush.ts"],
  },
  MPESA_SHORTCODE: {
    category: "Payments",
    required: "feature",
    feature: "Artwork cart M-Pesa checkout",
    usedBy: ["pages/api/mpesa/stkpush.ts"],
  },
  MPESA_PASSKEY: {
    category: "Payments",
    required: "feature",
    feature: "Artwork cart M-Pesa checkout",
    usedBy: ["pages/api/mpesa/stkpush.ts"],
  },
  MPESA_CALLBACK_URL: {
    category: "Payments",
    required: "feature",
    feature: "Artwork cart M-Pesa checkout",
    usedBy: ["pages/api/mpesa/stkpush.ts"],
  },
  EMAIL_HOST: {
    category: "Email",
    required: "feature",
    feature: "Contact form",
    usedBy: ["pages/api/contact/send-contact-email.ts"],
  },
  EMAIL_PORT: {
    category: "Email",
    required: "feature",
    feature: "Contact form (defaults to 587)",
    usedBy: ["pages/api/contact/send-contact-email.ts"],
  },
  EMAIL_SECURE: {
    category: "Email",
    required: "feature",
    feature: "Contact form TLS (true/false)",
    usedBy: ["pages/api/contact/send-contact-email.ts"],
  },
  EMAIL_USER: {
    category: "Email",
    required: "feature",
    feature: "Contact form SMTP user",
    usedBy: ["pages/api/contact/send-contact-email.ts"],
  },
  EMAIL_PASSWORD: {
    category: "Email",
    required: "feature",
    feature: "Contact form SMTP password",
    usedBy: ["pages/api/contact/send-contact-email.ts"],
  },
  CONTACT_FORM_RECIPIENT_EMAIL: {
    category: "Email",
    required: "feature",
    feature: "Contact form delivery address",
    usedBy: ["pages/api/contact/send-contact-email.ts"],
  },
};

const PLATFORM_VARS = new Set([
  "VERCEL",
  "VERCEL_URL",
  "VERCEL_ENV",
  "VERCEL_OIDC_TOKEN",
  "NODE_ENV",
]);

function parseEnvFile(path) {
  const out = {};
  if (!existsSync(path)) return out;
  const text = readFileSync(path, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function mergeEnv() {
  const layers = [
    parseEnvFile(resolve(root, ".env")),
    parseEnvFile(resolve(root, ".env.local")),
    parseEnvFile(resolve(root, ".env.vercel-audit")),
    process.env,
  ];
  const merged = {};
  for (const layer of layers) {
    Object.assign(merged, layer);
  }
  return merged;
}

function isSet(env, key) {
  const v = env[key];
  return typeof v === "string" && v.length > 0;
}

function statusFor(key, meta, env, sourceFiles) {
  const set = isSet(env, key);
  const sources = sourceFiles.filter((f) => isSet(parseEnvFile(f), key));
  let status;
  if (set) status = "SET";
  else if (meta.required === "always") status = "MISSING (required)";
  else if (meta.required === "production") status = "MISSING (required in prod)";
  else status = "MISSING (optional)";

  return { status, sources };
}

const env = mergeEnv();
const fileOnlyEnv = Object.assign(
  {},
  parseEnvFile(resolve(root, ".env")),
  parseEnvFile(resolve(root, ".env.local")),
  parseEnvFile(resolve(root, ".env.vercel-audit"))
);
const sourceFiles = [
  resolve(root, ".env"),
  resolve(root, ".env.local"),
  resolve(root, ".env.vercel-audit"),
].filter(existsSync);

console.log("Environment variable audit — jojjy-gallery-app\n");
console.log(`Loaded layers: ${sourceFiles.map((p) => p.replace(root + "/", "")).join(", ") || "(process.env only)"}`);
console.log(`Production snapshot: ${existsSync(resolve(root, ".env.vercel-audit")) ? ".env.vercel-audit" : "not pulled — run: vercel env pull .env.vercel-audit --environment production"}\n`);

const rows = [];
for (const [key, meta] of Object.entries(ENV_MANIFEST)) {
  const { status, sources } = statusFor(key, meta, env, sourceFiles);
  rows.push({
    key,
    category: meta.category,
    required: meta.required,
    status,
    sources: sources.map((s) => s.replace(root + "/", "")).join(", ") || "—",
    feature: meta.feature || "—",
  });
}

const categories = [...new Set(rows.map((r) => r.category))];
for (const cat of categories) {
  console.log(`## ${cat}`);
  for (const row of rows.filter((r) => r.category === cat)) {
    const icon =
      row.status === "SET"
        ? "✓"
        : row.status.startsWith("MISSING (required")
          ? "✗"
          : "○";
    console.log(`  ${icon} ${row.key.padEnd(32)} ${row.status}`);
    if (row.status !== "SET") {
      console.log(`      ${row.feature}`);
    }
    if (row.sources !== "—") {
      console.log(`      in: ${row.sources}`);
    }
  }
  console.log("");
}

const requiredMissing = rows.filter(
  (r) =>
    r.status.startsWith("MISSING (required") &&
    (r.required === "always" ||
      (r.required === "production" && process.env.NODE_ENV === "production"))
);
const prodOnlyMissing = rows.filter(
  (r) => r.status === "MISSING (required in prod)"
);

console.log("--- Summary ---");
console.log(`Total tracked: ${rows.length}`);
console.log(`Set: ${rows.filter((r) => r.status === "SET").length}`);
console.log(`Missing (required always): ${rows.filter((r) => r.status === "MISSING (required)").length}`);
console.log(`Missing (required in production): ${prodOnlyMissing.length}`);
console.log(`Missing (optional / feature): ${rows.filter((r) => r.status === "MISSING (optional)").length}`);

if (prodOnlyMissing.length) {
  console.log("\nProduction blockers (fix in Vercel → Settings → Environment Variables):");
  for (const r of prodOnlyMissing) {
    console.log(`  - ${r.key}`);
  }
}

const localExtra = Object.keys(fileOnlyEnv).filter(
  (k) => !ENV_MANIFEST[k] && !PLATFORM_VARS.has(k)
);
if (localExtra.length) {
  console.log("\nExtra keys in env files (not referenced in app code audit):");
  for (const k of localExtra.sort()) console.log(`  - ${k}`);
}

console.log("\nNote: NEXTAUTH_URL can be inferred from VERCEL_URL on Vercel when unset.");
console.log("Note: Seeded music with https:// storageKey URLs does not need Cloudinary.\n");

process.exit(requiredMissing.length + prodOnlyMissing.length > 0 ? 1 : 0);
