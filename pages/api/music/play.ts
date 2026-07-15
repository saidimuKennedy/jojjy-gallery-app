import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import {
  incrementPlayQuota,
  mergeAnonymousQuotasToUser,
  resolvePlayAccess,
} from "@/lib/music/entitlements";
import {
  anonCookieHeader,
  ensureAnonymousKey,
  parseCookies,
  signedTrackUrl,
  signPlayToken,
} from "@/lib/music/playback";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res
      .status(405)
      .json({ success: false, message: `Method ${req.method} Not Allowed` });
  }

  const session = await getServerSession(req, res, authOptions);
  const userId = session?.user?.id as string | undefined;

  const cookies = parseCookies(req.headers.cookie);
  const { key: anonymousKey, setCookie } = ensureAnonymousKey(cookies);

  if (userId && cookies.jg_music_aid) {
    try {
      await mergeAnonymousQuotasToUser(cookies.jg_music_aid, userId);
    } catch (e) {
      console.warn("quota merge failed", e);
    }
  }

  const releaseId = Number(req.body?.releaseId);
  const trackId =
    req.body?.trackId !== undefined ? Number(req.body.trackId) : undefined;

  if (!Number.isFinite(releaseId)) {
    return res.status(400).json({ success: false, message: "releaseId required" });
  }

  try {
    const release = await prisma.release.findUnique({
      where: { id: releaseId },
      include: {
        accessPolicy: true,
        tracks: { orderBy: { trackNumber: "asc" } },
      },
    });

    if (!release) {
      return res.status(404).json({ success: false, message: "Release not found" });
    }

    const decision = await resolvePlayAccess({
      release,
      userId,
      anonymousKey: userId ? null : anonymousKey,
    });

    if (!decision.allow) {
      if (setCookie) {
        res.setHeader("Set-Cookie", anonCookieHeader(anonymousKey));
      }
      return res.status(403).json({
        success: false,
        message:
          decision.reason === "membership_required"
            ? "Studio Membership required"
            : decision.reason === "purchase_required"
              ? "Purchase required"
              : "Playback unavailable",
        reason: decision.reason,
      });
    }

    const track =
      (trackId
        ? release.tracks.find((t) => t.id === trackId)
        : release.tracks[0]) || null;

    if (!track) {
      return res.status(400).json({ success: false, message: "No tracks on release" });
    }

    let remainingTease = decision.remainingTease;
    if (decision.reason === "tease") {
      const count = await incrementPlayQuota({
        releaseId: release.id,
        userId,
        anonymousKey: userId ? null : anonymousKey,
      });
      const limit = release.accessPolicy?.paidPlayLimit ?? 3;
      remainingTease = Math.max(0, limit - count);
    }

    await prisma.release.update({
      where: { id: release.id },
      data: { playCount: { increment: 1 } },
    });

    const exp = Math.floor(Date.now() / 1000) + 300;
    const token = signPlayToken({
      releaseId: release.id,
      trackId: track.id,
      storageKey: track.storageKey,
      exp,
    });

    let streamUrl: string;
    if (
      track.storageKey.startsWith("http://") ||
      track.storageKey.startsWith("https://")
    ) {
      // Seed / demo tracks stored as absolute URLs
      streamUrl = track.storageKey;
    } else {
      try {
        streamUrl = signedTrackUrl(track.storageKey, 300);
      } catch {
        streamUrl = `/api/music/stream?token=${encodeURIComponent(token)}`;
      }
    }

    if (setCookie && !userId) {
      res.setHeader("Set-Cookie", anonCookieHeader(anonymousKey));
    }

    return res.status(200).json({
      success: true,
      data: {
        trackId: track.id,
        title: track.title,
        streamUrl,
        token,
        expiresAt: new Date(exp * 1000).toISOString(),
        accessReason: decision.reason,
        remainingTease: remainingTease ?? null,
      },
    });
  } catch (error) {
    console.error("music play", error);
    return res.status(500).json({
      success: false,
      message: (error as Error).message || "Playback failed",
    });
  }
}
