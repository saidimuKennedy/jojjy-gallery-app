import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import {
  resolveViewerAccess,
  serializeReleasePublic,
} from "@/lib/music/entitlements";
import { ANON_COOKIE, parseCookies } from "@/lib/music/playback";

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

  const slug = String(req.query.slug || "");
  if (!slug) {
    return res.status(400).json({ success: false, message: "slug required" });
  }

  try {
    const release = await prisma.release.findUnique({
      where: { slug },
      include: {
        accessPolicy: true,
        tracks: { orderBy: { trackNumber: "asc" } },
      },
    });

    if (!release) {
      return res.status(404).json({ success: false, message: "Release not found" });
    }

    if (
      release.publishStatus === "SCHEDULED" &&
      release.publishAt &&
      release.publishAt <= new Date()
    ) {
      await prisma.release.update({
        where: { id: release.id },
        data: { publishStatus: "PUBLISHED" },
      });
      release.publishStatus = "PUBLISHED";
    }

    if (
      release.publishStatus !== "PUBLISHED" &&
      release.publishStatus !== "ARCHIVED"
    ) {
      return res.status(404).json({ success: false, message: "Release not found" });
    }

    const session = await getServerSession(req, res, authOptions);
    const userId = session?.user?.id as string | undefined;
    const cookies = parseCookies(req.headers.cookie);
    const anonymousKey = cookies[ANON_COOKIE] || null;

    const viewerAccess = await resolveViewerAccess({
      release,
      userId,
      anonymousKey: userId ? null : anonymousKey,
    });

    return res.status(200).json({
      success: true,
      data: {
        ...serializeReleasePublic(release),
        viewerAccess,
      },
    });
  } catch (error) {
    console.error("music release detail", error);
    return res.status(500).json({
      success: false,
      message: (error as Error).message || "Failed to load release",
    });
  }
}
