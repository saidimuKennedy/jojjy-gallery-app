import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { serializeReleasePublic } from "@/lib/music/entitlements";

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

  try {
    const now = new Date();
    const releases = await prisma.release.findMany({
      where: {
        OR: [
          { publishStatus: "PUBLISHED" },
          {
            publishStatus: "SCHEDULED",
            publishAt: { lte: now },
          },
        ],
      },
      include: {
        accessPolicy: true,
        tracks: { orderBy: { trackNumber: "asc" } },
      },
      orderBy: [{ releaseDate: "desc" }, { createdAt: "desc" }],
    });

    // Auto-promote due scheduled releases (lightweight)
    for (const r of releases) {
      if (r.publishStatus === "SCHEDULED") {
        await prisma.release.update({
          where: { id: r.id },
          data: { publishStatus: "PUBLISHED" },
        });
        r.publishStatus = "PUBLISHED";
      }
    }

    const published = releases.filter((r) => r.publishStatus === "PUBLISHED");

    return res.status(200).json({
      success: true,
      data: published.map(serializeReleasePublic),
    });
  } catch (error) {
    console.error("music releases list", error);
    return res.status(500).json({
      success: false,
      message: (error as Error).message || "Failed to list releases",
    });
  }
}
