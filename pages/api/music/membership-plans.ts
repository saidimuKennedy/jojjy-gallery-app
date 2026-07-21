import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { musicDisplayPrice } from "@/lib/currency";

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
    const plans = await prisma.membershipPlan.findMany({
      where: { active: true },
      orderBy: { price: "asc" },
    });
    return res.status(200).json({
      success: true,
      data: plans.map((p) => {
        const kesPrice = Number(p.price);
        const { price, currency } = musicDisplayPrice(kesPrice);
        return {
          id: p.id,
          name: p.name,
          description: p.description,
          price,
          currency,
          priceKes: kesPrice,
          durationDays: p.durationDays,
        };
      }),
    });
  } catch (error) {
    console.error("membership plans", error);
    return res.status(500).json({
      success: false,
      message: (error as Error).message || "Failed to load plans",
    });
  }
}
