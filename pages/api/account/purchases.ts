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
      include: {
        items: {
          include: {
            artwork: { select: { title: true } },
            ticketType: {
              select: { name: true, event: { select: { title: true } } },
            },
            productVariant: {
              select: { sku: true, product: { select: { name: true } } },
            },
            release: { select: { title: true } },
            membershipPlan: { select: { name: true } },
          },
        },
      },
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
        fulfilledAt: o.fulfilledAt ? o.fulfilledAt.toISOString() : null,
        items: o.items.map((item) => {
          let label: string = item.itemType;
          const a = item as typeof item & {
            artwork?: { title: string } | null;
            ticketType?: { name: string; event: { title: string } } | null;
            productVariant?: {
              sku: string;
              product: { name: string };
            } | null;
            release?: { title: string } | null;
            membershipPlan?: { name: string } | null;
          };
          if (a.artwork) label = a.artwork.title;
          if (a.ticketType)
            label = `${a.ticketType.name} — ${a.ticketType.event.title}`;
          if (a.productVariant)
            label = `${a.productVariant.product.name} (${a.productVariant.sku})`;
          if (a.release) label = a.release.title;
          if (a.membershipPlan) label = a.membershipPlan.name;
          return {
            itemType: item.itemType,
            quantity: item.quantity,
            label,
          };
        }),
      })),
    });
  } catch (error) {
    console.error("Error listing purchases:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
