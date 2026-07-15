import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { UserRole } from "@prisma/client";
import prisma from "@/lib/prisma";
import {
  releaseExpiredReservations,
  RESERVATION_HOLD_HOURS,
} from "@/lib/reservations";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST" && req.method !== "DELETE") {
    res.setHeader("Allow", ["POST", "DELETE"]);
    return res
      .status(405)
      .json({ success: false, message: `Method ${req.method} Not Allowed` });
  }

  const session = await getServerSession(req, res, authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return res
      .status(401)
      .json({ success: false, message: "Authentication required" });
  }

  const { id } = req.query;
  const artworkId = parseInt(id as string, 10);
  if (!artworkId || Number.isNaN(artworkId)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid artwork ID" });
  }

  try {
    await releaseExpiredReservations(artworkId);

    if (req.method === "POST") {
      const reservedUntil = new Date(
        Date.now() + RESERVATION_HOLD_HOURS * 3600_000
      );
      const result = await prisma.artwork.updateMany({
        where: { id: artworkId, status: "AVAILABLE", isAvailable: true },
        data: {
          status: "RESERVED",
          reservedUntil,
          reservedByUserId: userId,
        },
      });

      if (result.count === 0) {
        return res.status(409).json({
          success: false,
          message: "Artwork is not available to reserve",
        });
      }

      return res.status(200).json({
        success: true,
        data: { reservedUntil: reservedUntil.toISOString() },
      });
    }

    // DELETE — cancel hold (holder or admin)
    const artwork = await prisma.artwork.findUnique({
      where: { id: artworkId },
      select: { status: true, reservedByUserId: true },
    });

    if (!artwork || artwork.status !== "RESERVED") {
      return res.status(404).json({
        success: false,
        message: "No active reservation found for this artwork",
      });
    }

    const isHolder = artwork.reservedByUserId === userId;
    const isAdmin = session.user.role === UserRole.ADMIN;
    if (!isHolder && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Only the reserving user or an admin may cancel this hold",
      });
    }

    await prisma.artwork.update({
      where: { id: artworkId },
      data: {
        status: "AVAILABLE",
        reservedUntil: null,
        reservedByUserId: null,
      },
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error handling artwork reservation:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
