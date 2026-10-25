import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { isSupportedCurrency, musicCatalogPrice } from "@/lib/currency";
import { getViewerMembership } from "@/lib/music/membership";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res
      .status(405)
      .json({ success: false, message: `Method ${req.method} Not Allowed` });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    const userId = session?.user?.id as string | undefined;

    const rawPlans = await prisma.membershipPlan.findMany({
      where: {
        active: true,
        durationDays: { gt: 0 },
        price: { gte: 0 },
      },
      orderBy: { id: "asc" },
    });

    const unsupported = rawPlans.filter(
      (plan) => !isSupportedCurrency(plan.currency)
    );
    if (unsupported.length > 0) {
      console.warn(
        "Skipping membership plans with unsupported currency",
        unsupported.map((plan) => plan.id)
      );
    }

    const plans = rawPlans
      .filter((plan) => isSupportedCurrency(plan.currency))
      .map((plan) => {
        const stored = Number(plan.price);
        const { price, currency } = musicCatalogPrice(stored, plan.currency);
        return {
          id: plan.id,
          name: plan.name,
          description: plan.description,
          price: price ?? 0,
          currency,
          durationDays: plan.durationDays,
        };
      })
      .sort((a, b) => a.price - b.price);

    let viewerMembership: {
      active: boolean;
      status: string | null;
      expiresAt: string | null;
      startedAt: string | null;
      planName: string | null;
      isFounding: boolean;
    } | null = null;

    if (userId) {
      const viewer = await getViewerMembership(userId);
      viewerMembership = viewer
        ? {
            active: viewer.active,
            status: viewer.status,
            expiresAt: viewer.expiresAt.toISOString(),
            startedAt: viewer.startedAt.toISOString(),
            planName: viewer.planName,
            isFounding: viewer.isFounding,
          }
        : {
            active: false,
            status: null,
            expiresAt: null,
            startedAt: null,
            planName: null,
            isFounding: false,
          };
    }

    return res.status(200).json({
      success: true,
      data: {
        plans,
        viewerMembership,
      },
    });
  } catch (error) {
    console.error("membership plans", error);
    return res.status(500).json({
      success: false,
      message: (error as Error).message || "Failed to load plans",
    });
  }
}
