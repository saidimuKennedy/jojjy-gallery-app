import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

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

  try {
    switch (req.method) {
      case "GET":
        const artwork = await prisma.artwork.findUnique({
          where: { id: parseInt(id) },
        });
        if (!artwork) {
          return res
            .status(404)
            .json({ success: false, message: "Artwork not found" });
        }
        return res.status(200).json({ success: true, data: artwork });

      case "PUT":
          const updatedArtwork = await prisma.artwork.update({
          where: { id: parseInt(id) },
          data: req.body,
        });
        return res.status(200).json({ success: true, data: updatedArtwork });

      case "DELETE":
        await prisma.artwork.delete({
          where: { id: parseInt(id) },
        });
        return res.status(200).json({
          success: true,
          message: "Artwork deleted successfully",
        });

      default:
        res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
        return res.status(405).json({
          success: false,
          message: `Method ${req.method} Not Allowed`,
        });
    }
  } catch (error) {
    console.error("Error handling artwork:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}