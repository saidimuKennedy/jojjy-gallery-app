import prisma from "@/lib/prisma";
import { convertPrismaMediaBlogEntryWithRelationsToAPI } from "@/types/api";
import type { MediaBlogEntryWithRelations } from "@/types/api";
import type { MediaBlogFile, MediaBlogEntry } from "@prisma/client";

export interface MediaBlogListOptions {
  page?: number;
  limit?: number;
  minimal?: boolean;
}

type MediaBlogEntryWithOptionalFiles = MediaBlogEntry & {
  mediaFiles?: MediaBlogFile[];
};

export async function getMediaBlogEntries(
  options: MediaBlogListOptions = {}
): Promise<{ entries: MediaBlogEntryWithRelations[]; total: number }> {
  const page = options.page ?? 1;
  const limit = options.limit ?? 12;
  const skip = (page - 1) * limit;
  const minimal = options.minimal ?? false;

  const [entries, total] = await Promise.all([
    prisma.mediaBlogEntry.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: minimal
        ? undefined
        : { mediaFiles: { orderBy: { order: "asc" } } },
    }),
    prisma.mediaBlogEntry.count(),
  ]);

  return {
    entries: (entries as MediaBlogEntryWithOptionalFiles[]).map((entry) =>
      convertPrismaMediaBlogEntryWithRelationsToAPI({
        ...entry,
        mediaFiles: minimal ? [] : (entry.mediaFiles ?? []),
      })
    ),
    total,
  };
}

export async function getMediaBlogEntryById(
  id: number
): Promise<MediaBlogEntryWithRelations | null> {
  const entry = await prisma.mediaBlogEntry.findUnique({
    where: { id },
    include: { mediaFiles: { orderBy: { order: "asc" } } },
  });

  if (!entry) return null;
  return convertPrismaMediaBlogEntryWithRelationsToAPI(entry);
}
