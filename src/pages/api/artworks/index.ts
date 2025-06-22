import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { convertPrismaArtworkToAPI } from "@/types/api";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }
  try {
    const artworks = await prisma.artwork.findMany({
      orderBy: { createdAt: "desc" },
    });

    const apiArtworks = artworks.map(convertPrismaArtworkToAPI);
    
    return res.status(200).json({
      success: true,
      data: apiArtworks,
      total: apiArtworks.length,
    });
  } catch (error) {
    console.error("Error fetching artworks:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
