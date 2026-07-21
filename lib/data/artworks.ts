import { getServerSession } from "next-auth/next";
import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { convertPrismaArtworkWithRelationsToAPI } from "@/types/api";
import type { ArtworkWithRelations } from "@/types/api";
import { releaseExpiredReservations } from "@/lib/reservations";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

export interface ArtworkListOptions {
  page?: number;
  limit?: number | "all";
  minimal?: boolean;
  inGallery?: boolean;
  isAvailable?: boolean;
  status?: string;
}

export async function getArtworks(
  options: ArtworkListOptions = {},
  sessionUserId?: string | null
): Promise<{ artworks: ArtworkWithRelations[]; total: number }> {
  const minimal = options.minimal ?? false;
  const where: Record<string, unknown> = {};

  if (options.inGallery !== undefined) {
    where.inGallery = options.inGallery;
  }
  if (options.isAvailable !== undefined) {
    where.isAvailable = options.isAvailable;
  }
  if (options.status) {
    where.status = options.status;
  }

  let skip: number | undefined;
  let take: number | undefined;

  if (options.limit === "all") {
    skip = undefined;
    take = undefined;
  } else {
    const limit = options.limit ?? 10;
    const page = options.page ?? 1;
    skip = (page - 1) * limit;
    take = limit;
  }

  await releaseExpiredReservations();

  const [artworks, total] = await Promise.all([
    prisma.artwork.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: minimal
        ? { series: true }
        : { series: true, mediaFiles: true },
    }),
    prisma.artwork.count({ where }),
  ]);

  return {
    artworks: artworks.map((artwork) => ({
      ...convertPrismaArtworkWithRelationsToAPI(artwork),
      reservedByCurrentUser:
        !!sessionUserId && artwork.reservedByUserId === sessionUserId,
    })),
    total,
  };
}

export async function getArtworkById(
  id: number,
  sessionUserId?: string | null
): Promise<ArtworkWithRelations | null> {
  await releaseExpiredReservations();

  const artwork = await prisma.artwork.findUnique({
    where: { id },
    include: { series: true, mediaFiles: true },
  });

  if (!artwork) return null;

  return {
    ...convertPrismaArtworkWithRelationsToAPI(artwork),
    reservedByCurrentUser:
      !!sessionUserId && artwork.reservedByUserId === sessionUserId,
  };
}

export async function getSessionUserId(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<string | null> {
  const session = await getServerSession(req, res, authOptions);
  return session?.user?.id ?? null;
}
