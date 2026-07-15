import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { convertPrismaArtworkWithRelationsToAPI } from "@/types/api";
import { releaseExpiredReservations } from "@/lib/reservations";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

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
    const artworkId = parseInt(id);
    await releaseExpiredReservations(artworkId);

    const [artwork, session] = await Promise.all([
      prisma.artwork.findUnique({
        where: { id: artworkId },
        include: {
          series: true,
          mediaFiles: true,
        },
      }),
      getServerSession(req, res, authOptions),
    ]);
    if (!artwork) {
      return res
        .status(404)
        .json({ success: false, message: "Artwork not found" });
    }

    return res.status(200).json({
      success: true,
      data: {
        ...convertPrismaArtworkWithRelationsToAPI(artwork),
        reservedByCurrentUser:
          !!session?.user?.id && artwork.reservedByUserId === session.user.id,
      },
    });
  } catch (error) {
    console.error("Error fetching artwork:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
