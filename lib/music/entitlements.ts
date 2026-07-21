import type {
  AccessPolicy,
  MusicAccessMode,
  MusicPublishStatus,
  Release,
  Track,
} from "@prisma/client";
import prisma from "@/lib/prisma";
import { musicCatalogPrice } from "@/lib/currency";

export type ReleaseWithAccess = Release & {
  accessPolicy: AccessPolicy | null;
  tracks: Track[];
};

export type PlayDecision =
  | { allow: true; reason: "free" | "owned" | "member" | "tease"; remainingTease?: number }
  | { allow: false; reason: "unavailable" | "membership_required" | "purchase_required" };

export function currentAccessMode(
  release: Pick<ReleaseWithAccess, "accessPolicy">
): MusicAccessMode {
  return release.accessPolicy?.accessMode ?? "PAID";
}

export function paidPlayLimit(release: Pick<ReleaseWithAccess, "accessPolicy">): number {
  return release.accessPolicy?.paidPlayLimit ?? 3;
}

export async function hasReleaseUnlock(
  userId: string,
  releaseId: number
): Promise<boolean> {
  const row = await prisma.releaseUnlock.findUnique({
    where: { userId_releaseId: { userId, releaseId } },
  });
  return !!row;
}

export async function hasActiveMembership(userId: string): Promise<boolean> {
  const now = new Date();
  const row = await prisma.membership.findFirst({
    where: {
      userId,
      status: "ACTIVE",
      expiresAt: { gt: now },
    },
  });
  return !!row;
}

export async function getPlayCount(params: {
  releaseId: number;
  userId?: string | null;
  anonymousKey?: string | null;
}): Promise<number> {
  if (params.userId) {
    const row = await prisma.paidPlayQuota.findUnique({
      where: {
        releaseId_userId: {
          releaseId: params.releaseId,
          userId: params.userId,
        },
      },
    });
    return row?.playCount ?? 0;
  }
  if (params.anonymousKey) {
    const row = await prisma.paidPlayQuota.findUnique({
      where: {
        releaseId_anonymousKey: {
          releaseId: params.releaseId,
          anonymousKey: params.anonymousKey,
        },
      },
    });
    return row?.playCount ?? 0;
  }
  return 0;
}

export async function incrementPlayQuota(params: {
  releaseId: number;
  userId?: string | null;
  anonymousKey?: string | null;
}): Promise<number> {
  if (params.userId) {
    const row = await prisma.paidPlayQuota.upsert({
      where: {
        releaseId_userId: {
          releaseId: params.releaseId,
          userId: params.userId,
        },
      },
      create: {
        releaseId: params.releaseId,
        userId: params.userId,
        playCount: 1,
      },
      update: { playCount: { increment: 1 } },
    });
    return row.playCount;
  }
  if (!params.anonymousKey) {
    throw new Error("anonymousKey required when userId is missing");
  }
  const row = await prisma.paidPlayQuota.upsert({
    where: {
      releaseId_anonymousKey: {
        releaseId: params.releaseId,
        anonymousKey: params.anonymousKey,
      },
    },
    create: {
      releaseId: params.releaseId,
      anonymousKey: params.anonymousKey,
      playCount: 1,
    },
    update: { playCount: { increment: 1 } },
  });
  return row.playCount;
}

/** Merge anonymous quotas into user quotas on login (ADR-022). */
export async function mergeAnonymousQuotasToUser(
  anonymousKey: string,
  userId: string
): Promise<void> {
  const anonRows = await prisma.paidPlayQuota.findMany({
    where: { anonymousKey },
  });
  for (const anon of anonRows) {
    const limitRow = await prisma.accessPolicy.findUnique({
      where: { releaseId: anon.releaseId },
    });
    const limit = limitRow?.paidPlayLimit ?? 3;
    const existing = await prisma.paidPlayQuota.findUnique({
      where: {
        releaseId_userId: { releaseId: anon.releaseId, userId },
      },
    });
    const next = Math.min(limit, (existing?.playCount ?? 0) + anon.playCount);
    await prisma.paidPlayQuota.upsert({
      where: {
        releaseId_userId: { releaseId: anon.releaseId, userId },
      },
      create: {
        releaseId: anon.releaseId,
        userId,
        playCount: next,
      },
      update: { playCount: next },
    });
    await prisma.paidPlayQuota.delete({ where: { id: anon.id } });
  }
}

export type ViewerAccessState =
  | "free"
  | "owned"
  | "tease"
  | "locked"
  | "membership_required"
  | "unavailable";

export type ViewerAccess = {
  state: ViewerAccessState;
  owned: boolean;
  isStudioMember: boolean;
  remainingTease: number | null;
  canPlay: boolean;
};

export async function resolveViewerAccess(params: {
  release: ReleaseWithAccess;
  userId?: string | null;
  anonymousKey?: string | null;
}): Promise<ViewerAccess> {
  const decision = await resolvePlayAccess(params);

  if (decision.allow) {
    switch (decision.reason) {
      case "free":
        return {
          state: "free",
          owned: false,
          isStudioMember: false,
          remainingTease: null,
          canPlay: true,
        };
      case "owned":
        return {
          state: "owned",
          owned: true,
          isStudioMember: false,
          remainingTease: null,
          canPlay: true,
        };
      case "member":
        return {
          state: "owned",
          owned: false,
          isStudioMember: true,
          remainingTease: null,
          canPlay: true,
        };
      case "tease":
        return {
          state: "tease",
          owned: false,
          isStudioMember: false,
          remainingTease: decision.remainingTease ?? null,
          canPlay: true,
        };
    }
  }

  if (decision.reason === "membership_required") {
    return {
      state: "membership_required",
      owned: false,
      isStudioMember: false,
      remainingTease: null,
      canPlay: false,
    };
  }
  if (decision.reason === "purchase_required") {
    return {
      state: "locked",
      owned: false,
      isStudioMember: false,
      remainingTease: 0,
      canPlay: false,
    };
  }
  return {
    state: "unavailable",
    owned: false,
    isStudioMember: false,
    remainingTease: null,
    canPlay: false,
  };
}

export async function resolvePlayAccess(params: {
  release: ReleaseWithAccess;
  userId?: string | null;
  anonymousKey?: string | null;
}): Promise<PlayDecision> {
  const { release, userId, anonymousKey } = params;
  const status = release.publishStatus as MusicPublishStatus;

  if (status !== "PUBLISHED" && status !== "ARCHIVED") {
    return { allow: false, reason: "unavailable" };
  }

  const mode = currentAccessMode(release);

  if (mode === "FREE") {
    return { allow: true, reason: "free" };
  }

  if (userId && (await hasReleaseUnlock(userId, release.id))) {
    return { allow: true, reason: "owned" };
  }

  if (mode === "MEMBERS_ONLY") {
    if (userId && (await hasActiveMembership(userId))) {
      return { allow: true, reason: "member" };
    }
    return { allow: false, reason: "membership_required" };
  }

  // PAID
  if (userId && (await hasReleaseUnlock(userId, release.id))) {
    return { allow: true, reason: "owned" };
  }

  const limit = paidPlayLimit(release);
  const count = await getPlayCount({
    releaseId: release.id,
    userId,
    anonymousKey,
  });
  if (count < limit) {
    return {
      allow: true,
      reason: "tease",
      remainingTease: limit - count,
    };
  }
  return { allow: false, reason: "purchase_required" };
}

export function stackMembershipExpiry(
  currentExpiresAt: Date | null,
  durationDays: number,
  now = new Date()
): Date {
  const base =
    currentExpiresAt && currentExpiresAt > now ? currentExpiresAt : now;
  const next = new Date(base);
  next.setUTCDate(next.getUTCDate() + durationDays);
  return next;
}

export function serializeReleasePublic(
  release: Release & {
    accessPolicy: AccessPolicy | null;
    tracks?: Track[];
  }
) {
  const mode = release.accessPolicy?.accessMode ?? "PAID";
  const storedPrice = release.accessPolicy?.price
    ? Number(release.accessPolicy.price)
    : null;
  const storedCurrency = release.accessPolicy?.currency ?? "USD";
  const { price, currency } = musicCatalogPrice(storedPrice, storedCurrency);
  return {
    id: release.id,
    slug: release.slug,
    title: release.title,
    description: release.description,
    artistNotes: release.artistNotes,
    coverImage: release.coverImage,
    artistName: release.artistName,
    releaseType: release.releaseType,
    genre: release.genre,
    publishStatus: release.publishStatus,
    publishAt: release.publishAt?.toISOString() ?? null,
    explicit: release.explicit,
    releaseDate: release.releaseDate?.toISOString() ?? null,
    playCount: release.playCount,
    accessMode: mode,
    price,
    currency,
    paidPlayLimit: release.accessPolicy?.paidPlayLimit ?? 3,
    locked: mode !== "FREE",
    tracks: (release.tracks ?? [])
      .slice()
      .sort((a, b) => a.trackNumber - b.trackNumber)
      .map((t) => ({
        id: t.id,
        title: t.title,
        trackNumber: t.trackNumber,
        duration: t.duration,
      })),
  };
}
