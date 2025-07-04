import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { convertPrismaArtworkWithRelationsToAPI } from "@/types/api";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res
      .status(400)
      .json({ success: false, message: "Invalid artwork id" });
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res
      .status(405)
      .json({ success: false, message: `Method ${req.method} Not Allowed` });
  }

  try {
    const artwork = await prisma.artwork.findUnique({
      where: { id: parseInt(id) },
      include: {
        series: true,
        mediaFiles: true,
      },
    });
    if (!artwork) {
      return res
        .status(404)
        .json({ success: false, message: "Artwork not found" });
    }
    return res.status(200).json({
      success: true,
      data: convertPrismaArtworkWithRelationsToAPI(artwork),
    });
  } catch (error) {
    console.error("Error fetching artwork:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
