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

  // Only published entries are public: publishedAt set and reached.
  // DRAFT (null) entries never appear here.
  const published = { publishedAt: { lte: new Date() } };

  const [entries, total] = await Promise.all([
    prisma.mediaBlogEntry.findMany({
      where: published,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: minimal
        ? undefined
        : { mediaFiles: { orderBy: { order: "asc" } } },
    }),
    prisma.mediaBlogEntry.count({ where: published }),
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

  // Draft or scheduled-future entries are not publicly visible.
  if (!entry || !entry.publishedAt || entry.publishedAt > new Date()) {
    return null;
  }
  return convertPrismaMediaBlogEntryWithRelationsToAPI(entry);
}
