import type { NextApiRequest, NextApiResponse } from "next";
import { verifyPlayToken } from "@/lib/music/playback";

/**
 * Fallback stream proxy for tracks whose storageKey is not an absolute URL
 * and Cloudinary signing is unavailable. Token comes from POST /api/music/play.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", ["GET", "HEAD"]);
    return res
      .status(405)
      .json({ success: false, message: `Method ${req.method} Not Allowed` });
  }

  const token =
    typeof req.query.token === "string" ? req.query.token : undefined;
  if (!token) {
    return res.status(400).json({ success: false, message: "token required" });
  }

  const payload = verifyPlayToken(token);
  if (!payload) {
    return res.status(403).json({ success: false, message: "Invalid or expired token" });
  }

  const { storageKey } = payload;
  if (
    !storageKey.startsWith("http://") &&
    !storageKey.startsWith("https://")
  ) {
    return res.status(400).json({
      success: false,
      message: "Stream proxy only supports absolute storage URLs",
    });
  }

  try {
    const upstream = await fetch(storageKey, {
      method: req.method,
      headers: req.headers.range ? { Range: req.headers.range } : undefined,
    });

    if (!upstream.ok && upstream.status !== 206) {
      return res.status(upstream.status).json({
        success: false,
        message: "Upstream audio unavailable",
      });
    }

    res.status(upstream.status);
    const pass = [
      "content-type",
      "content-length",
      "content-range",
      "accept-ranges",
      "cache-control",
    ] as const;
    for (const h of pass) {
      const v = upstream.headers.get(h);
      if (v) res.setHeader(h, v);
    }
    res.setHeader("Cache-Control", "private, no-store");

    if (req.method === "HEAD" || !upstream.body) {
      return res.end();
    }

    const buf = Buffer.from(await upstream.arrayBuffer());
    return res.send(buf);
  } catch (error) {
    console.error("music stream", error);
    return res.status(500).json({
      success: false,
      message: (error as Error).message || "Stream failed",
    });
  }
}
