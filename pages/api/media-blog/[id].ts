import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { MediaBlogEntryType, MediaFileType } from "@prisma/client";
import { convertPrismaMediaBlogEntryToAPI, MediaBlogEntryAPI } from "../media-blog";

interface MediaBlogFileFormData {
  id?: number;
  url: string;
  type: MediaFileType;
  description: string;
  thumbnailUrl?: string;
  order: number;
}

interface MediaBlogEntryFormData {
  id: number;
  title: string;
  shortDesc?: string;
  type: MediaBlogEntryType;
  externalLink?: string;
  thumbnailUrl?: string;
  duration?: string;
  content?: string;
  mediaFiles: MediaBlogFileFormData[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ success: false, message: "Invalid Media Blog Entry ID" });
  }

  const mediaBlogEntryId = parseInt(id as string);

  if (isNaN(mediaBlogEntryId)) {
    return res.status(400).json({ success: false, message: "Invalid Media Blog Entry ID format" });
  }

  if (req.method === "GET") {
    try {
      const entry = await prisma.mediaBlogEntry.findUnique({
        where: { id: mediaBlogEntryId },
        include: { mediaFiles: { orderBy: { order: 'asc' } } },
      });

      if (!entry) {
        return res.status(404).json({ success: false, message: "Media Blog Entry not found" });
      }

      return res.status(200).json({ success: true, data: convertPrismaMediaBlogEntryToAPI(entry) });
    } catch (error) {
      console.error("Error fetching single media blog entry:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  } else if (req.method === "PUT") {
    try {
      const { title, shortDesc, type, externalLink, thumbnailUrl, duration, content, mediaFiles } = req.body as MediaBlogEntryFormData;

      if (req.body.id && req.body.id !== mediaBlogEntryId) {
        return res.status(400).json({ success: false, message: "ID in URL and body mismatch." });
      }

      const updatedEntry = await prisma.$transaction(async (prisma) => {
        const entry = await prisma.mediaBlogEntry.update({
          where: { id: mediaBlogEntryId },
          data: {
            title,
            shortDesc,
            type,
            externalLink,
            thumbnailUrl,
            duration,
            content,
            updatedAt: new Date(),
          },
          include: { mediaFiles: true },
        });

        const existingFileIds = entry.mediaFiles.map(f => f.id);
        const incomingFileIds = mediaFiles.filter(f => f.id).map(f => f.id!);

        const filesToDelete = existingFileIds.filter(id => !incomingFileIds.includes(id));
        if (filesToDelete.length > 0) {
          await prisma.mediaBlogFile.deleteMany({
            where: {
              id: {
                in: filesToDelete,
              },
            },
          });
        }

        for (const fileData of mediaFiles) {
          if (fileData.id) {
            await prisma.mediaBlogFile.update({
              where: { id: fileData.id },
              data: {
                url: fileData.url,
                type: fileData.type,
                description: fileData.description,
                thumbnailUrl: fileData.thumbnailUrl,
                order: fileData.order,
              },
            });
          } else {
            await prisma.mediaBlogFile.create({
              data: {
                url: fileData.url,
                type: fileData.type,
                description: fileData.description,
                thumbnailUrl: fileData.thumbnailUrl,
                order: fileData.order,
                mediaBlogEntryId: entry.id,
              },
            });
          }
        }
        return entry;
      });

      const finalEntry = await prisma.mediaBlogEntry.findUnique({
        where: { id: mediaBlogEntryId },
        include: { mediaFiles: { orderBy: { order: 'asc' } } },
      });

      if (!finalEntry) {
        return res.status(404).json({ success: false, message: "Media Blog Entry not found after update." });
      }

      return res.status(200).json({ success: true, data: convertPrismaMediaBlogEntryToAPI(finalEntry) });
    } catch (error: any) {
      console.error("Error updating media blog entry:", error);
      if (error.code === 'P2025') {
        return res.status(404).json({ success: false, message: "Media Blog Entry not found." });
      }
      return res.status(500).json({ success: false, message: error.message || "Internal server error" });
    }
  } else if (req.method === "DELETE") {
    try {
      const deletedEntry = await prisma.mediaBlogEntry.delete({
        where: { id: mediaBlogEntryId },
      });

      return res.status(200).json({ success: true, message: "Media Blog Entry deleted successfully", data: deletedEntry });
    } catch (error: any) {
      console.error("Error deleting media blog entry:", error);
      if (error.code === 'P2025') {
        return res.status(404).json({ success: false, message: "Media Blog Entry not found." });
      }
      return res.status(500).json({ success: false, message: error.message || "Internal server error" });
    }
  } else {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }
}