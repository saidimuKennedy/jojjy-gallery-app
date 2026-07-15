import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { convertPrismaArtworkToAPI } from "@/types/api";

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

  const session = await getServerSession(req, res, authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return res
      .status(401)
      .json({ success: false, message: "Authentication required" });
  }

  try {
    const items = await prisma.wishlistItem.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { artwork: true },
    });

    const data = items.map((item) => ({
      id: item.id,
      artworkId: item.artworkId,
      createdAt: item.createdAt.toISOString(),
      artwork: convertPrismaArtworkToAPI(item.artwork),
    }));

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Error listing wishlist:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
