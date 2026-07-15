import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import {
  hasActiveMembership,
  serializeReleasePublic,
} from "@/lib/music/entitlements";

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
    const unlocks = await prisma.releaseUnlock.findMany({
      where: { userId },
      include: {
        release: {
          include: {
            accessPolicy: true,
            tracks: { orderBy: { trackNumber: "asc" } },
          },
        },
      },
    });

    const owned = unlocks.map((u) => ({
      ...serializeReleasePublic(u.release),
      librarySource: "PURCHASE" as const,
    }));

    const member = await hasActiveMembership(userId);
    let memberReleases: ReturnType<typeof serializeReleasePublic>[] = [];
    if (member) {
      const rows = await prisma.release.findMany({
        where: {
          publishStatus: { in: ["PUBLISHED", "ARCHIVED"] },
          accessPolicy: { accessMode: "MEMBERS_ONLY" },
        },
        include: {
          accessPolicy: true,
          tracks: { orderBy: { trackNumber: "asc" } },
        },
      });
      const ownedIds = new Set(owned.map((r) => r.id));
      memberReleases = rows
        .filter((r) => !ownedIds.has(r.id))
        .map((r) => ({
          ...serializeReleasePublic(r),
          librarySource: "MEMBERSHIP" as const,
        }));
    }

    return res.status(200).json({
      success: true,
      data: [...owned, ...memberReleases],
    });
  } catch (error) {
    console.error("music library", error);
    return res.status(500).json({
      success: false,
      message: (error as Error).message || "Failed to load library",
    });
  }
}
