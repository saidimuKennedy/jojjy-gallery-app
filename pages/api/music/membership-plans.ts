import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { musicCatalogPrice } from "@/lib/currency";

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

    const plans = await prisma.membershipPlan.findMany({
      where: { active: true },
      orderBy: { price: "asc" },
    });

    let viewerMembership: {
      active: boolean;
      expiresAt: string | null;
      startedAt: string | null;
      planName: string | null;
      isFounding: boolean;
    } | null = null;

    if (userId) {
      const now = new Date();
      const membership = await prisma.membership.findFirst({
        where: {
          userId,
          status: "ACTIVE",
          expiresAt: { gt: now },
        },
        orderBy: { expiresAt: "desc" },
        include: { plan: true },
      });
      if (membership) {
        viewerMembership = {
          active: true,
          expiresAt: membership.expiresAt.toISOString(),
          startedAt: membership.startedAt.toISOString(),
          planName: membership.plan.name,
          isFounding: membership.isFounding,
        };
      } else {
        viewerMembership = {
          active: false,
          expiresAt: null,
          startedAt: null,
          planName: null,
          isFounding: false,
        };
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        plans: plans.map((p) => {
          const stored = Number(p.price);
          const { price, currency } = musicCatalogPrice(stored, p.currency);
          return {
            id: p.id,
            name: p.name,
            description: p.description,
            price,
            currency,
            durationDays: p.durationDays,
          };
        }),
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
