import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { serializeReleasePublic } from "@/lib/music/entitlements";
import { getViewerMembership } from "@/lib/music/membership";
import {
  STUDIO_LIBRARY_RELEASE_WHERE,
  promoteDueScheduledReleases,
} from "@/lib/music/studio-access";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res
      .status(405)
      .json({ success: false, message: `Method ${req.method} Not Allowed` });
  }

  const session = await getServerSession(req, res, authOptions);
  const userId = session?.user?.id as string | undefined;
  if (!userId) {
    return res
      .status(401)
      .json({ success: false, message: "Authentication required" });
  }

  try {
    await promoteDueScheduledReleases();

    const unlocks = await prisma.releaseUnlock.findMany({
      where: {
        userId,
        release: { publishStatus: { in: ["PUBLISHED", "ARCHIVED"] } },
      },
      include: {
        release: {
          include: {
            accessPolicy: true,
            tracks: { orderBy: { trackNumber: "asc" } },
          },
        },
      },
    });

    const collection = unlocks.map((u) => ({
      ...serializeReleasePublic(u.release),
      librarySource: "PURCHASE" as const,
    }));

    const viewer = await getViewerMembership(userId);
    const member = !!viewer?.active;
    let studioAccess: ReturnType<typeof serializeReleasePublic>[] = [];
    if (member) {
      const rows = await prisma.release.findMany({
        where: STUDIO_LIBRARY_RELEASE_WHERE,
        include: {
          accessPolicy: true,
          tracks: { orderBy: { trackNumber: "asc" } },
        },
      });
      const ownedIds = new Set(collection.map((r) => r.id));
      studioAccess = rows
        .filter((r) => !ownedIds.has(r.id))
        .map((r) => ({
          ...serializeReleasePublic(r),
          librarySource: "MEMBERSHIP" as const,
        }));
    }

    return res.status(200).json({
      success: true,
      data: {
        collection,
        studioAccess,
        studioMembership: viewer
          ? {
              active: viewer.active,
              status: viewer.status,
              expiresAt: viewer.expiresAt.toISOString(),
              startedAt: viewer.startedAt.toISOString(),
              isFounding: viewer.isFounding,
            }
          : { active: false },
      },
    });
  } catch (error) {
    console.error("music library", error);
    return res.status(500).json({
      success: false,
      message: (error as Error).message || "Failed to load library",
    });
  }
}
