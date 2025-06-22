import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

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

  // Validate the artworkId
  if (!artworkId || typeof artworkId !== "number") {
    return res
      .status(400)
      .json({ success: false, message: "Invalid artwork ID" });
  }

  try {
    const artwork = await prisma.artwork.update({
      where: { id: artworkId },
      data: {
        likes: {
          increment: 1,
        },
      },
    });

    return res.status(200).json({ success: true, data: artwork });
  } catch (error) {
    console.error("Error liking artwork:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
