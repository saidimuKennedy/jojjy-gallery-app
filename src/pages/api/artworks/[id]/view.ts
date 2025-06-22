import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { ar } from "@faker-js/faker";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res
      .status(405)
      .json({ success: false, message: `Method ${req.method} Not Allowed` });
  }

  const { id } = req.query;

  const artworkId = parseInt(id as string, 10);
  if (!artworkId || typeof artworkId !== "number") {
    return res
      .status(400)
      .json({ success: false, message: "Invalid artwork ID" });
  }

  try {
    const artwork = await prisma.artwork.update({
      where: { id: artworkId },
      data: {
        views: {
          increment: 1,
        },
      },
    });

    return res.status(200).json({ success: true, data: artwork });
  } catch (error) {
    console.error("Error updating artwork views:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
