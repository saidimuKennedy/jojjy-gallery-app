import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import {
  APIResponse,
  ArtworkWithRelations,
  APIError,
  convertPrismaArtworkWithRelationsToAPI,
} from "@/types/api";
import { UserRole } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse<ArtworkWithRelations> | APIError>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res
      .status(405)
      .json({ success: false, message: `Method ${req.method} Not Allowed` });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res
      .status(401)
      .json({ success: false, message: "Authentication required" });
  }

  if (session.user.role !== UserRole.ADMIN) {
    return res.status(403).json({
      success: false,
      message: "Forbidden: You do not have permission to create artworks.",
    });
  }

  const { mediaFiles, ...artworkData } = req.body;

  try {
    const {
      title,
      artist,
      category,
      price,
      imageUrl,
      description,
      dimensions,
      isAvailable,
      medium,
      year,
      inGallery,
      seriesId,
    } = artworkData;

    if (
      !title ||
      !artist ||
      !category ||
      price === undefined ||
      price === null ||
      !imageUrl ||
      !medium ||
      year === undefined ||
      year === null
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing or invalid required artwork fields.",
      });
    }
    const newArtwork = await prisma.$transaction(async (tx) => {
      const createdArtwork = await tx.artwork.create({
        data: {
          title,
          artist,
          category,
          price: parseFloat(price),
          imageUrl,
          description,
          dimensions,
          isAvailable: isAvailable ?? true,
          medium,
          year: parseInt(year),
          inGallery: inGallery ?? false,

          ...(seriesId !== "" && seriesId !== null && {
            series: {
              connect: { id: parseInt(seriesId) },
            },
          }),
          mediaFiles: {
            create: mediaFiles.map((mf: any) => ({
              url: mf.url,
              type: mf.type,
              description: mf.description,
              thumbnailUrl: mf.thumbnailUrl,
              order: mf.order,
            })),
          },
        },
      });

      return tx.artwork.findUnique({
        where: { id: createdArtwork.id },
        include: { series: true, mediaFiles: true },
      });
    });

    if (!newArtwork) {
      return res.status(500).json({
        success: false,
        message: "Failed to create artwork or retrieve it after creation.",
      });
    }

    return res.status(201).json({
      success: true,
      data: convertPrismaArtworkWithRelationsToAPI(newArtwork),
    });
  } catch (error) {
    console.error("Error creating artwork:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
}