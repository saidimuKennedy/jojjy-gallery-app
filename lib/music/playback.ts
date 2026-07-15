import crypto from "crypto";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const ANON_COOKIE = "jg_music_aid";

export function getPlaySecret(): string {
  return (
    process.env.MUSIC_PLAY_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "dev-music-play-secret"
  );
}

export function signPlayToken(payload: {
  releaseId: number;
  trackId: number;
  storageKey: string;
  exp: number;
}): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto
    .createHmac("sha256", getPlaySecret())
    .update(body)
    .digest("base64url");
  return `${body}.${sig}`;
}

export function verifyPlayToken(token: string): {
  releaseId: number;
  trackId: number;
  storageKey: string;
  exp: number;
} | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expect = crypto
    .createHmac("sha256", getPlaySecret())
    .update(body)
    .digest("base64url");
  if (sig.length !== expect.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect))) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

/** Short-lived Cloudinary authenticated URL for a track storageKey (public_id). */
export function signedTrackUrl(storageKey: string, expiresInSec = 300): string {
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSec;
  return cloudinary.url(storageKey, {
    resource_type: "video",
    type: "authenticated",
    sign_url: true,
    secure: true,
    expires_at: expiresAt,
  });
}

export { ANON_COOKIE };

export function parseCookies(header?: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    out[k] = decodeURIComponent(v);
  }
  return out;
}

export function ensureAnonymousKey(
  cookies: Record<string, string>
): { key: string; setCookie: boolean } {
  const existing = cookies[ANON_COOKIE];
  if (existing && existing.length >= 8) {
    return { key: existing, setCookie: false };
  }
  return { key: crypto.randomUUID(), setCookie: true };
}

export function anonCookieHeader(key: string): string {
  const maxAge = 60 * 60 * 24 * 365;
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${ANON_COOKIE}=${encodeURIComponent(key)}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${secure}`;
}
