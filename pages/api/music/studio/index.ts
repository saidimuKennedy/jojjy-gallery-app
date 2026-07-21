import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { DEFAULT_STUDIO_PAGE } from "@/lib/music/studio-defaults";

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
    let content = await prisma.studioPageContent.findUnique({ where: { id: 1 } });
    if (!content) {
      content = await prisma.studioPageContent.create({
        data: {
          id: 1,
          heroTitle: DEFAULT_STUDIO_PAGE.heroTitle,
          heroSubtitle: DEFAULT_STUDIO_PAGE.heroSubtitle,
          relationshipLead: DEFAULT_STUDIO_PAGE.relationshipLead,
          journeySteps: DEFAULT_STUDIO_PAGE.journeySteps,
          faq: DEFAULT_STUDIO_PAGE.faq,
        },
      });
    }

    const memberReleases = await prisma.release.findMany({
      where: {
        publishStatus: "PUBLISHED",
        accessPolicy: { accessMode: "MEMBERS_ONLY" },
      },
      select: {
        id: true,
        slug: true,
        title: true,
        coverImage: true,
      },
      orderBy: { releaseDate: "desc" },
    });

    const paidEarlyCount = await prisma.release.count({
      where: {
        publishStatus: "PUBLISHED",
        accessPolicy: { accessMode: { in: ["PAID", "MEMBERS_ONLY"] } },
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        content: {
          heroTitle: content.heroTitle,
          heroSubtitle: content.heroSubtitle,
          relationshipLead: content.relationshipLead,
          journeySteps: content.journeySteps as string[],
          faq: content.faq as Array<{ q: string; a: string }>,
        },
        insideStudio: {
          memberReleaseCount: memberReleases.length,
          memberReleases,
          earlyAccessCount: paidEarlyCount,
        },
      },
    });
  } catch (error) {
    console.error("studio page", error);
    return res.status(500).json({
      success: false,
      message: (error as Error).message || "Failed to load studio page",
    });
  }
}
