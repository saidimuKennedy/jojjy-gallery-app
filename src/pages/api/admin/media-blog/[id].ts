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
    | APIResponse<MediaBlogEntryWithRelations | null>
    | APIError
    | { success: boolean; message: string }
  >
) {
  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res
      .status(400)
      .json({ success: false, message: "Invalid media blog entry ID" });
  }

  const entryId = parseInt(id);
  if (isNaN(entryId)) {
    return res.status(400).json({
      success: false,
      message: "Media blog entry ID must be a number",
    });
  }

  // --- RBAC Check using NextAuth.js ---
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user || !session.user.role) {
    return res.status(401).json({
      success: false,
      message: "Authentication required or session data incomplete",
    });
  }

  try {
    switch (req.method) {
      case "PUT":
        if (session.user.role !== UserRole.ADMIN) {
          return res.status(403).json({
            success: false,
            message:
              "Forbidden: You do not have permission to update media blog entries.",
          });
        }

        const { mediaFiles, ...entryData } = req.body;

        const updatedEntry = await prisma.$transaction(async (tx) => {
          const updated = await tx.mediaBlogEntry.update({
            where: { id: entryId },
            data: {
              title: entryData.title,
              shortDesc: entryData.shortDesc,
              type: entryData.type as MediaBlogEntryType,
              externalLink: entryData.externalLink,
            },
          });

          const existingMediaFiles = await tx.mediaBlogFile.findMany({
            where: { mediaBlogEntryId: entryId },
          });

          const incomingMediaFileIds = new Set(
            mediaFiles.map((mf: any) => mf.id).filter(Boolean)
          );
          const existingMediaFileIds = new Set(
            existingMediaFiles.map((mf) => mf.id)
          );

          const mediaFilesToDelete = existingMediaFiles.filter(
            (mf) => !incomingMediaFileIds.has(mf.id)
          );

          if (mediaFilesToDelete.length > 0) {
            await tx.mediaBlogFile.deleteMany({
              where: {
                id: { in: mediaFilesToDelete.map((mf) => mf.id) },
                mediaBlogEntryId: entryId,
              },
            });
          }

          for (let i = 0; i < mediaFiles.length; i++) {
            const mf = mediaFiles[i];
            if (mf.id && existingMediaFileIds.has(mf.id)) {
              await tx.mediaBlogFile.update({
                where: { id: mf.id },
                data: {
                  url: mf.url,
                  type: mf.type as MediaFileType,
                  description: mf.description,
                  thumbnailUrl: mf.thumbnailUrl,
                  order: i,
                },
              });
            } else {
              await tx.mediaBlogFile.create({
                data: {
                  url: mf.url,
                  type: mf.type as MediaFileType,
                  description: mf.description,
                  thumbnailUrl: mf.thumbnailUrl,
                  order: i,
                  mediaBlogEntry: { connect: { id: entryId } },
                },
              });
            }
          }

          return tx.mediaBlogEntry.findUnique({
            where: { id: entryId },
            include: { mediaFiles: { orderBy: { order: "asc" } } },
          });
        });

        if (!updatedEntry) {
          return res.status(500).json({
            success: false,
            message: "Failed to update media blog entry.",
          });
        }

        return res.status(200).json({
          success: true,
          data: convertPrismaMediaBlogEntryWithRelationsToAPI(updatedEntry),
        });

      case "DELETE":
        if (session.user.role !== UserRole.ADMIN) {
          return res.status(403).json({
            success: false,
            message:
              "Forbidden: You do not have permission to delete media blog entries.",
          });
        }

        await prisma.mediaBlogFile.deleteMany({
          where: { mediaBlogEntryId: entryId },
        });

        await prisma.mediaBlogEntry.delete({
          where: { id: entryId },
        });
        return res.status(200).json({
          success: true,
          message: "Media blog entry deleted successfully",
          data: null,
        });

      default:
        res.setHeader("Allow", ["PUT", "DELETE"]);
        return res.status(405).json({
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
