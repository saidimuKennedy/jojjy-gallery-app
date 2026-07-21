import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { stackMembershipExpiry } from "@/lib/music/entitlements";

type DbClient = Prisma.TransactionClient | typeof prisma;

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
  if (!plan || !plan.active) {
    throw new Error("Membership plan not found or inactive");
  }

  const existing = await db.membership.findFirst({
    where: { userId: params.userId, status: "ACTIVE" },
    orderBy: { expiresAt: "desc" },
  });

  const expiresAt = stackMembershipExpiry(
    existing?.expiresAt ?? null,
    plan.durationDays
  );

  if (existing) {
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

  return db.membership.create({
    data: {
      userId: params.userId,
      membershipPlanId: plan.id,
      orderId: params.orderId ?? null,
      grantedByCrmUserId: params.grantedByCrmUserId ?? null,
      expiresAt,
      status: "ACTIVE",
    },
  });
}
