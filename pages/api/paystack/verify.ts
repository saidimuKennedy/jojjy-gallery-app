import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { completeOrderFromPaystackReference } from "@/lib/orders/complete-payment";

function serializeOrder(order: NonNullable<Awaited<ReturnType<typeof loadOrder>>>) {
  return {
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
      release: item.release,
      membershipPlan: item.membershipPlan,
    })),
    tickets: order.tickets.map((t) => ({
      id: t.id,
      code: t.code,
      ticketType: t.ticketType,
    })),
  };
}

async function loadOrder(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          artwork: { select: { id: true, title: true } },
          ticketType: {
            select: {
              name: true,
              event: { select: { title: true, slug: true } },
            },
          },
          productVariant: {
            select: {
              sku: true,
              product: { select: { name: true } },
            },
          },
          release: { select: { id: true, title: true, slug: true } },
          membershipPlan: { select: { id: true, name: true } },
        },
      },
      tickets: {
        include: {
          ticketType: { select: { name: true } },
        },
      },
    },
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
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

  const { reference } = req.body as { reference?: string };
  if (!reference || typeof reference !== "string") {
    return res
      .status(400)
      .json({ success: false, message: "reference is required" });
  }

  const order = await prisma.order.findUnique({
    where: { paystackRef: reference },
  });

  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  if (order.userId !== session.user.id) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  try {
    await completeOrderFromPaystackReference(reference);
    const updated = await loadOrder(order.id);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    return res.status(200).json({ success: true, data: serializeOrder(updated) });
  } catch (error) {
    console.error("Paystack verify error:", error);
    const pending = await loadOrder(order.id);
    if (pending?.status === "PENDING") {
      return res.status(202).json({
        success: false,
        message: error instanceof Error ? error.message : "Verification failed",
        data: serializeOrder(pending),
      });
    }
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Verification failed",
    });
  }
}
