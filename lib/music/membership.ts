import type { Membership } from "@prisma/client";
import prisma from "@/lib/prisma";
import { stackMembershipExpiry } from "@/lib/music/entitlements";

export async function grantOrExtendMembership(params: {
  userId: string;
  membershipPlanId: number;
  orderId?: string | null;
  grantedByCrmUserId?: string | null;
}): Promise<Membership> {
  const plan = await prisma.membershipPlan.findUnique({
    where: { id: params.membershipPlanId },
  });
  if (!plan || !plan.active) {
    throw new Error("Membership plan not found or inactive");
  }

  const existing = await prisma.membership.findFirst({
    where: { userId: params.userId, status: "ACTIVE" },
    orderBy: { expiresAt: "desc" },
  });

  const expiresAt = stackMembershipExpiry(
    existing?.expiresAt ?? null,
    plan.durationDays
  );

  if (existing) {
    return prisma.membership.update({
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

  return prisma.membership.create({
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
