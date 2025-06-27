import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { convertPrismaSeriesWithArtworksToAPI } from "@/types/api";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { slug } = req.query;

  if (!slug || typeof slug !== "string") {
    return res
      .status(400)
      .json({ success: false, message: "Invalid series slug" });
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res
      .status(405)
      .json({ success: false, message: `Method ${req.method} Not Allowed` });
  }

  try {
    const series = await prisma.series.findUnique({
      where: { slug },
      include: {
        artworks: {
          orderBy: { createdAt: "asc" }, 
        },
      },
    });

    if (!series) {
      return res
        .status(404)
        .json({ success: false, message: "Series not found" });
    }

    const apiSeries = convertPrismaSeriesWithArtworksToAPI(series);

    return res.status(200).json({ success: true, data: apiSeries });
  } catch (error) {
    console.error("Error fetching series by slug:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}