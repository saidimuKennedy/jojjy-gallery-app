import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

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

  const session = await getServerSession(req, res, authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return res
      .status(401)
      .json({ success: false, message: "Authentication required" });
  }

  try {
    const orders = await prisma.order.findMany({
      where: { userId, status: "PAID" },
      orderBy: { createdAt: "desc" },
      include: { items: true },
    });

    return res.status(200).json({
      success: true,
      data: orders.map((o) => ({
        id: o.id,
        status: o.status,
        amount: o.amount.toNumber(),
        currency: o.currency,
        timestamp: o.createdAt.toISOString(),
        itemTypes: [...new Set(o.items.map((i) => i.itemType))],
      })),
    });
  } catch (error) {
    console.error("Error listing purchases:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
