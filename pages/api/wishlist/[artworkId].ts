import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
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

  const { artworkId: artworkIdParam } = req.query;
  const artworkId = parseInt(artworkIdParam as string, 10);
  if (!artworkId || Number.isNaN(artworkId)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid artwork ID" });
  }

  try {
    const artwork = await prisma.artwork.findUnique({
      where: { id: artworkId },
      select: { id: true },
    });
    if (!artwork) {
      return res
        .status(404)
        .json({ success: false, message: "Artwork not found" });
    }

    if (req.method === "POST") {
      const item = await prisma.wishlistItem.upsert({
        where: {
          userId_artworkId: { userId, artworkId },
        },
        create: { userId, artworkId },
        update: {},
      });

      return res.status(200).json({
        success: true,
        data: {
          id: item.id,
          artworkId: item.artworkId,
          createdAt: item.createdAt.toISOString(),
        },
      });
    }

    // DELETE
    const existing = await prisma.wishlistItem.findUnique({
      where: { userId_artworkId: { userId, artworkId } },
    });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Artwork not on wishlist",
      });
    }

    await prisma.wishlistItem.delete({ where: { id: existing.id } });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error updating wishlist:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
