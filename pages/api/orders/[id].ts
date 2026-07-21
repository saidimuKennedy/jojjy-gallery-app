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
  if (!session?.user?.id) {
    return res
      .status(401)
      .json({ success: false, message: "Authentication required" });
  }

  const { id, reference } = req.query;
  if (
    (!id || Array.isArray(id)) &&
    (!reference || Array.isArray(reference))
  ) {
    return res.status(400).json({
      success: false,
      message: "Provide id or reference query param",
    });
  }

  try {
    const order = await prisma.order.findFirst({
      where: {
        userId: session.user.id,
        ...(typeof reference === "string"
          ? { paystackRef: reference }
          : { id: id as string }),
      },
      include: {
        items: {
          include: {
            artwork: { select: { id: true, title: true, imageUrl: true } },
            ticketType: {
              select: {
                id: true,
                name: true,
                event: { select: { title: true, slug: true, startsAt: true } },
              },
            },
            productVariant: {
              select: {
                sku: true,
                product: { select: { name: true } },
              },
            },
          },
        },
        tickets: {
          select: {
            id: true,
            code: true,
            ticketType: { select: { name: true } },
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: order.id,
        status: order.status,
        amount: order.amount.toNumber(),
        currency: order.currency,
        paystackRef: order.paystackRef,
        deliveryMethod: order.deliveryMethod,
        deliveryAddress: order.deliveryAddress,
        packaging: order.packaging,
        createdAt: order.createdAt.toISOString(),
        items: order.items.map((item) => ({
          id: item.id,
          itemType: item.itemType,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toNumber(),
          artwork: item.artwork,
          ticketType: item.ticketType,
          productVariant: item.productVariant,
        })),
        tickets: order.tickets,
      },
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
