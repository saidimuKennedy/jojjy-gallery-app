import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { MediaBlogEntryType, MediaFileType } from "@prisma/client";

export interface MediaBlogEntryAPI {
  id: number;
  title: string;
  shortDesc: string | null;
  type: MediaBlogEntryType;
  externalLink: string | null;
  thumbnailUrl: string | null;
  duration: string | null;
  content: string | null;
  createdAt: string;
  updatedAt: string;
  mediaFiles: Array<{
    id: number;
    url: string;
    type: string;
    description: string | null;
    thumbnailUrl: string | null;
    order: number;
  }>;
}

interface NewMediaBlogEntryFormData {
  title: string;
  shortDesc?: string;
  type: MediaBlogEntryType;
  externalLink?: string;
  thumbnailUrl?: string;
  duration?: string;
  content?: string;
  mediaFiles?: Array<{
    url: string;
    type: MediaFileType;
    description: string;
    thumbnailUrl?: string;
    order: number;
  }>;
}

export const convertPrismaMediaBlogEntryToAPI = (entry: any): MediaBlogEntryAPI => {
  return {
    id: entry.id,
    title: entry.title,
    shortDesc: entry.shortDesc,
    type: entry.type,
    externalLink: entry.externalLink,
    thumbnailUrl: entry.thumbnailUrl,
    duration: entry.duration,
    content: entry.content,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
    mediaFiles: entry.mediaFiles.map((mf: any) => ({
      id: mf.id,
      url: mf.url,
      type: mf.type,
      description: mf.description,
      thumbnailUrl: mf.thumbnailUrl,
      order: mf.order,
    })),
  };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {

  if (req.method === "GET") {
    try {
      const { page = "1", limit = "10", type, search } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const where: any = {};
      if (type) {
        if (Object.values(MediaBlogEntryType).includes(type.toString().toUpperCase() as MediaBlogEntryType)) {
          where.type = type.toString().toUpperCase();
        }
      }
      if (search) {
        where.OR = [
          { title: { contains: String(search), mode: "insensitive" } },
          { shortDesc: { contains: String(search), mode: "insensitive" } },
        ];
      }

      const [entries, total] = await prisma.$transaction([
        prisma.mediaBlogEntry.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: limitNum,
          include: { mediaFiles: { orderBy: { order: 'asc' } } },
        }),
        prisma.mediaBlogEntry.count({ where }),
      ]);

      const apiEntries = entries.map(convertPrismaMediaBlogEntryToAPI);

      return res.status(200).json({
        success: true,
        data: apiEntries,
        total: total,
        page: pageNum,
        limit: limitNum,
      });
    } catch (error) {
      console.error("Error fetching media blog entries:", error);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  } else if (req.method === "POST") {
    try {
      const { title, shortDesc, type, externalLink, thumbnailUrl, duration, content, mediaFiles } = req.body as NewMediaBlogEntryFormData;

      if (!title || !type) {
        return res.status(400).json({ success: false, message: "Title and Type are required." });
      }

      const newEntry = await prisma.mediaBlogEntry.create({
        data: {
          title,
          shortDesc,
          type,
          externalLink,
          thumbnailUrl,
          duration,
          content,
          mediaFiles: {
            create: mediaFiles?.map(file => ({
              url: file.url,
              type: file.type,
              description: file.description,
              thumbnailUrl: file.thumbnailUrl,
              order: file.order,
            })) || [],
          },
        },
        include: { mediaFiles: { orderBy: { order: 'asc' } } },
      });

      return res.status(201).json({ success: true, data: convertPrismaMediaBlogEntryToAPI(newEntry) });

    } catch (error: any) {
      console.error("Error creating media blog entry:", error);
      return res.status(500).json({ success: false, message: error.message || "Internal server error" });
    }
  } else {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }
}