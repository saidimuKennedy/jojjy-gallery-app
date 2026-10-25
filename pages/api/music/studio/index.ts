import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { DEFAULT_STUDIO_PAGE } from "@/lib/music/studio-defaults";
import {
  STUDIO_CURRENT_RELEASE_WHERE,
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

  try {
    const content = await prisma.studioPageContent.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        heroTitle: DEFAULT_STUDIO_PAGE.heroTitle,
        heroSubtitle: DEFAULT_STUDIO_PAGE.heroSubtitle,
        relationshipLead: DEFAULT_STUDIO_PAGE.relationshipLead,
        journeySteps: DEFAULT_STUDIO_PAGE.journeySteps,
        faq: DEFAULT_STUDIO_PAGE.faq,
      },
    });

    await promoteDueScheduledReleases();

    const memberReleases = await prisma.release.findMany({
      where: STUDIO_CURRENT_RELEASE_WHERE,
      select: {
        id: true,
        slug: true,
        title: true,
        coverImage: true,
      },
      orderBy: [
        { releaseDate: { sort: "desc", nulls: "last" } },
        { createdAt: "desc" },
      ],
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
