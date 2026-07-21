import type { NextApiRequest, NextApiResponse } from "next";
import { setPublicCacheHeaders } from "@/lib/api-cache";
import prisma from "@/lib/prisma";
import { convertPrismaMediaBlogEntryToAPI } from "../media-blog";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid Media Blog Entry ID" });
  }

  const mediaBlogEntryId = parseInt(id as string, 10);

  if (isNaN(mediaBlogEntryId)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid Media Blog Entry ID format" });
  }

  if (req.method === "GET") {
    try {
      const entry = await prisma.mediaBlogEntry.findUnique({
        where: { id: mediaBlogEntryId },
        include: { mediaFiles: { orderBy: { order: "asc" } } },
      });

      if (!entry) {
        return res
          .status(404)
          .json({ success: false, message: "Media Blog Entry not found" });
      }

      setPublicCacheHeaders(res);
      return res.status(200).json({
        success: true,
        data: convertPrismaMediaBlogEntryToAPI(entry),
      });
    } catch (error) {
      console.error("Error fetching single media blog entry:", error);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }

  res.setHeader("Allow", ["GET"]);
  return res.status(405).json({
    success: false,
    message:
      "Archive entries are managed in the CRM. This public API is read-only.",
  });
}
