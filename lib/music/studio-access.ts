import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

/**
 * Public Studio page: only current (published) member releases are shown.
 * Archived member releases belong in the member library, not the public page.
 */
export const STUDIO_CURRENT_RELEASE_WHERE: Prisma.ReleaseWhereInput = {
  publishStatus: "PUBLISHED",
  accessPolicy: { accessMode: "MEMBERS_ONLY" },
};

/**
 * Member library: archived releases remain reachable while a membership is
 * active, matching the entitlement resolver.
 */
export const STUDIO_LIBRARY_RELEASE_WHERE: Prisma.ReleaseWhereInput = {
  publishStatus: { in: ["PUBLISHED", "ARCHIVED"] },
  accessPolicy: { accessMode: "MEMBERS_ONLY" },
};

/** Promote scheduled releases whose public time has passed. */
export async function promoteDueScheduledReleases(now = new Date()): Promise<void> {
  await prisma.release.updateMany({
    where: {
      publishStatus: "SCHEDULED",
      publishAt: { not: null, lte: now },
    },
    data: { publishStatus: "PUBLISHED" },
  });
}
