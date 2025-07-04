import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import {
  APIResponse,
  MediaBlogEntryWithRelations,
  APIError,
  convertPrismaMediaBlogEntryWithRelationsToAPI,
} from "@/types/api";
import { UserRole, MediaBlogEntryType, MediaFileType } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    | APIResponse<MediaBlogEntryWithRelations | MediaBlogEntryWithRelations[]>
    | APIError
  >
) {
  // --- RBAC Check using NextAuth.js ---
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user || !session.user.role) {
    return res.status(401).json({
      success: false,
      message: "Authentication required or session data incomplete",
    });
  }
  // --- End RBAC Check ---

  try {
    switch (req.method) {
      case "GET":
        if (session.user.role !== UserRole.ADMIN) {
          return res.status(403).json({
            success: false,
            message:
              "Forbidden: You do not have permission to view media blog entries.",
          });
        }

        const mediaBlogEntries = await prisma.mediaBlogEntry.findMany({
          include: {
            mediaFiles: {
              orderBy: { order: "asc" },
            },
          },
          orderBy: {
            createdAt: "desc", 
          },
        });

        return res.status(200).json({
          success: true,
          data: mediaBlogEntries.map(
            convertPrismaMediaBlogEntryWithRelationsToAPI
          ),
        });

      case "POST":
        if (session.user.role !== UserRole.ADMIN) {
          return res.status(403).json({
            success: false,
            message:
              "Forbidden: You do not have permission to create media blog entries.",
          });
        }

        const { mediaFiles, ...entryData } = req.body;

        const newEntry = await prisma.$transaction(async (tx) => {
          const createdEntry = await tx.mediaBlogEntry.create({
            data: {
              title: entryData.title,
              shortDesc: entryData.shortDesc,
              type: entryData.type,
              externalLink: entryData.externalLink,
              mediaFiles: {
                create: mediaFiles.map((mf: any, index: number) => ({
                  url: mf.url,
                  type: mf.type as MediaFileType,
                  description: mf.description,
                  thumbnailUrl: mf.thumbnailUrl,
                  order: index,
                })),
              },
            },
          });

          return tx.mediaBlogEntry.findUnique({
            where: { id: createdEntry.id },
            include: { mediaFiles: { orderBy: { order: "asc" } } },
          });
        });

        if (!newEntry) {
          return res.status(500).json({
            success: false,
            message: "Failed to create media blog entry.",
          });
        }

        return res.status(201).json({
          success: true,
          data: convertPrismaMediaBlogEntryWithRelationsToAPI(newEntry),
        });

      default:
        res.setHeader("Allow", ["GET", "POST"]);
        return res
          .status(405)
          .json({
            success: false,
            message: `Method ${req.method} Not Allowed`,
          });
    }
  } catch (error) {
    console.error("Error handling media blog API:", error);
    return res.status(500).json({
      success: false,
      message: (error as Error).message || "Internal server error",
    });
  }
}
