import type { MembershipStatus, Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { stackMembershipExpiry } from "@/lib/music/entitlements";

type DbClient = Prisma.TransactionClient | typeof prisma;

export type ViewerMembership = {
  active: boolean;
  status: MembershipStatus;
  expiresAt: Date;
  startedAt: Date;
  planName: string;
  isFounding: boolean;
};

/**
 * Return the viewer's active membership if one exists, otherwise the latest
 * membership so an expired member can be distinguished from a visitor.
 */
export async function getViewerMembership(
  userId: string
): Promise<ViewerMembership | null> {
  const now = new Date();
  const active = await prisma.membership.findFirst({
    where: {
      userId,
      status: "ACTIVE",
      expiresAt: { gt: now },
    },
    orderBy: { expiresAt: "desc" },
    include: { plan: true },
  });
  const latest =
    active ??
    (await prisma.membership.findFirst({
      where: { userId },
      orderBy: { expiresAt: "desc" },
      include: { plan: true },
    }));

  if (!latest) return null;

  return {
    active: !!active,
    status: latest.status,
    expiresAt: latest.expiresAt,
    startedAt: latest.startedAt,
    planName: latest.plan.name,
    isFounding: latest.isFounding,
  };
}

export async function grantOrExtendMembership(
  params: {
    userId: string;
    membershipPlanId: number;
    orderId?: string | null;
    grantedByCrmUserId?: string | null;
  },
  db: DbClient = prisma
) {
  const plan = await db.membershipPlan.findUnique({
    where: { id: params.membershipPlanId },
  });
  if (
    !plan ||
    !plan.active ||
    plan.durationDays <= 0 ||
    plan.price.toNumber() < 0
  ) {
    throw new Error("Membership plan not found or inactive");
  }

  const now = new Date();
  const existing = await db.membership.findFirst({
    where: { userId: params.userId, status: "ACTIVE" },
    orderBy: { expiresAt: "desc" },
  });

  if (existing && existing.expiresAt > now) {
    const expiresAt = stackMembershipExpiry(
      existing.expiresAt,
      plan.durationDays,
      now
    );
    return db.membership.update({
      where: { id: existing.id },
      data: {
        membershipPlanId: plan.id,
        expiresAt,
        orderId: params.orderId ?? existing.orderId,
        grantedByCrmUserId:
          params.grantedByCrmUserId ?? existing.grantedByCrmUserId,
        status: "ACTIVE",
      },
    });
  }

  if (existing) {
    await db.membership.update({
      where: { id: existing.id },
      data: { status: "EXPIRED" },
    });
  }

  return db.membership.create({
    data: {
      userId: params.userId,
      membershipPlanId: plan.id,
      orderId: params.orderId ?? null,
      grantedByCrmUserId: params.grantedByCrmUserId ?? null,
      startedAt: now,
      expiresAt: stackMembershipExpiry(null, plan.durationDays, now),
      status: "ACTIVE",
    },
  });
}
