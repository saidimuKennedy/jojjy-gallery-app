#!/usr/bin/env node
/**
 * Push critical env vars from local files to Vercel (production + preview).
 * Requires working Vercel API access (CLI or REST). If you get
 * "Unexpected token '<', <!DOCTYPE" the dashboard is the fallback.
 *
 *   node scripts/push-env-to-vercel.mjs
 *   node scripts/push-env-to-vercel.mjs --dry-run
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dryRun = process.argv.includes("--dry-run");

function parseEnvFile(path) {
  const out = {};
  if (!existsSync(path)) return out;
  for (const line of readFileSync(path, "utf8").split("\n")) {
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

const local = {
  ...parseEnvFile(resolve(root, ".env")),
  ...parseEnvFile(resolve(root, ".env.local")),
};

const projectJson = JSON.parse(
  readFileSync(resolve(root, ".vercel/project.json"), "utf8")
);

/** @type {{ key: string, value: string, sensitive?: boolean, productionValue?: string }[]} */
const VARS = [
  {
    key: "NEXTAUTH_SECRET",
    value: local.NEXTAUTH_SECRET,
    sensitive: true,
  },
  {
    key: "NEXTAUTH_URL",
    value: local.NEXTAUTH_URL,
    productionValue: "https://njenga-ngugi.vercel.app",
  },
  {
    key: "DATABASE_URL",
    value: local.DATABASE_URL,
    sensitive: true,
  },
  {
    key: "DIRECT_URL",
    value: local.DIRECT_URL,
    sensitive: true,
  },
  {
    key: "NEXT_PUBLIC_CURRENCY",
    value: local.NEXT_PUBLIC_CURRENCY || "USD",
    productionValue: "USD",
  },
];

const missing = VARS.filter((v) => !v.value && v.key !== "NEXT_PUBLIC_CURRENCY");
if (missing.length) {
  console.error("Missing local values for:", missing.map((v) => v.key).join(", "));
  process.exit(1);
}

console.log(`Project: ${projectJson.projectName}`);
console.log(`Targets: production, preview\n`);

for (const v of VARS) {
  const prodVal =
    v.productionValue ??
    (v.key === "NEXTAUTH_URL" ? "https://njenga-ngugi.vercel.app" : v.value);
  console.log(`→ ${v.key}${v.sensitive ? " (sensitive)" : ""}`);
  if (dryRun) {
    console.log(`  production value length: ${String(prodVal).length}`);
    continue;
  }
  for (const env of ["production", "preview"]) {
    const value = env === "production" ? prodVal : v.value;
    const args = [
      "env",
      "add",
      v.key,
      env,
      "--value",
      value,
      "--yes",
    ];
    if (v.sensitive) args.push("--sensitive");
    const r = spawnSync("vercel", args, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    if (r.status !== 0) {
      console.error(`  ✗ ${env}: ${(r.stderr || r.stdout || "").trim()}`);
      process.exit(1);
    }
    console.log(`  ✓ ${env}`);
  }
}

console.log("\nDone. Redeploy production for changes to take effect:");
console.log("  vercel --prod");
