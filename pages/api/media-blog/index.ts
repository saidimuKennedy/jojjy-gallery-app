import type { NextApiRequest, NextApiResponse } from "next";
import { MediaBlogEntryType } from "@prisma/client";
import { setPublicCacheHeaders } from "@/lib/api-cache";
import {
  getMediaBlogEntries,
} from "@/lib/data/media-blog";
import prisma from "@/lib/prisma";

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

export const convertPrismaMediaBlogEntryToAPI = (
  entry: {
    id: number;
    title: string;
    shortDesc: string | null;
    type: MediaBlogEntryType;
    externalLink: string | null;
    thumbnailUrl: string | null;
    duration: string | null;
    content: string | null;
    createdAt: Date;
    updatedAt: Date;
    mediaFiles?: Array<{
      id: number;
      url: string;
      type: string;
      description: string | null;
      thumbnailUrl: string | null;
      order: number;
    }>;
  }
): MediaBlogEntryAPI => {
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
    mediaFiles: (entry.mediaFiles ?? []).map((mf) => ({
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
  res: NextApiResponse
) {
  if (req.method === "GET") {
    try {
      const { page = "1", limit = "10", type, search, include } = req.query;
      const minimal = include === "minimal";

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);

      const where: Record<string, unknown> = {};
      if (type) {
        if (
          Object.values(MediaBlogEntryType).includes(
            type.toString().toUpperCase() as MediaBlogEntryType
          )
        ) {
          where.type = type.toString().toUpperCase();
        }
      }
      if (search) {
        where.OR = [
          { title: { contains: String(search), mode: "insensitive" } },
          { shortDesc: { contains: String(search), mode: "insensitive" } },
        ];
      }

      if (Object.keys(where).length > 0) {
        const skip = (pageNum - 1) * limitNum;
        const entries = await prisma.mediaBlogEntry.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: limitNum,
          include: { mediaFiles: { orderBy: { order: "asc" } } },
        });
        const total = await prisma.mediaBlogEntry.count({ where });
        const apiEntries = entries.map((entry) =>
          convertPrismaMediaBlogEntryToAPI({
            ...entry,
            mediaFiles: minimal ? [] : entry.mediaFiles,
          })
        );

        setPublicCacheHeaders(res);
        return res.status(200).json({
          success: true,
          data: apiEntries,
          total,
          page: pageNum,
          limit: limitNum,
        });
      }

      const { entries, total } = await getMediaBlogEntries({
        page: pageNum,
        limit: limitNum,
        minimal,
      });

      setPublicCacheHeaders(res);
      return res.status(200).json({
        success: true,
        data: entries,
        total,
        page: pageNum,
        limit: limitNum,
      });
    } catch (error) {
      console.error("Error fetching media blog entries:", error);
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
