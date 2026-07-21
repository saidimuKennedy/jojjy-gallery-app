import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import {
  DeliveryMethod,
  OrderItemType,
  PackagingType,
  PaymentProvider,
  Prisma,
} from "@prisma/client";
import prisma from "@/lib/prisma";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { releaseExpiredReservations } from "@/lib/reservations";
import {
  buildPaystackReference,
  initializeTransaction,
  isPaystackConfigured,
  paystackCallbackUrl,
} from "@/lib/paystack";

const DELIVERY_METHODS = new Set(Object.values(DeliveryMethod));
const PACKAGING_TYPES = new Set(Object.values(PackagingType));

interface CheckoutItem {
  productVariantId?: number;
  ticketTypeId?: number;
  artworkId?: number;
  releaseId?: number;
  membershipPlanId?: number;
  quantity?: number;
}

function countItemKinds(item: CheckoutItem) {
  return (
    (typeof item.productVariantId === "number" ? 1 : 0) +
    (typeof item.ticketTypeId === "number" ? 1 : 0) +
    (typeof item.artworkId === "number" ? 1 : 0) +
    (typeof item.releaseId === "number" ? 1 : 0) +
    (typeof item.membershipPlanId === "number" ? 1 : 0)
  );
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
  const userId = session?.user?.id;
  const userEmail = session?.user?.email;
  if (!userId) {
    return res
      .status(401)
      .json({ success: false, message: "Authentication required" });
  }

  const {
    items,
    deliveryMethod,
    deliveryAddress,
    packaging,
    deliveryFee,
    phoneNumber,
    paymentProvider,
  } = req.body as {
    items?: CheckoutItem[];
    deliveryMethod?: string;
    deliveryAddress?: string;
    packaging?: string;
    deliveryFee?: number;
    phoneNumber?: string;
    paymentProvider?: string;
  };

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: "At least one order item is required",
    });
  }

  for (const item of items) {
    if (countItemKinds(item) !== 1) {
      return res.status(400).json({
        success: false,
        message:
          "Each item must have exactly one of productVariantId, ticketTypeId, artworkId, releaseId, or membershipPlanId",
      });
    }
    const qty = item.quantity ?? 1;
    if (!Number.isInteger(qty) || qty < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive integer",
      });
    }
    if (typeof item.artworkId === "number" && qty !== 1) {
      return res.status(400).json({
        success: false,
        message: "Original artworks can only be ordered as quantity 1",
      });
    }
  }

  if (
    deliveryMethod != null &&
    !DELIVERY_METHODS.has(deliveryMethod as DeliveryMethod)
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid deliveryMethod",
    });
  }

  if (
    packaging != null &&
    !PACKAGING_TYPES.has(packaging as PackagingType)
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid packaging",
    });
  }

  const provider: PaymentProvider =
    paymentProvider === "MPESA" ? "MPESA" : "PAYSTACK";

  try {
    await releaseExpiredReservations();

    const orderItemsData: {
      itemType: OrderItemType;
      productVariantId: number | null;
      ticketTypeId: number | null;
      artworkId: number | null;
      releaseId: number | null;
      membershipPlanId: number | null;
      quantity: number;
      unitPrice: Prisma.Decimal;
    }[] = [];

    let subtotal = 0;

    for (const item of items) {
      const quantity = item.quantity ?? 1;

      if (typeof item.artworkId === "number") {
        const artwork = await prisma.artwork.findUnique({
          where: { id: item.artworkId },
        });
        if (
          !artwork ||
          !artwork.isAvailable ||
          artwork.price.toNumber() <= 0
        ) {
          return res.status(404).json({
            success: false,
            message: `Artwork ${item.artworkId} is not available for purchase`,
          });
        }
        const reservedByBuyer =
          artwork.status === "RESERVED" &&
          artwork.reservedByUserId === userId;
        if (artwork.status !== "AVAILABLE" && !reservedByBuyer) {
          return res.status(404).json({
            success: false,
            message: `Artwork ${item.artworkId} is not available for purchase`,
          });
        }
        const unit = artwork.price.toNumber();
        subtotal += unit;
        orderItemsData.push({
          itemType: OrderItemType.ARTWORK,
          productVariantId: null,
          ticketTypeId: null,
          artworkId: artwork.id,
          releaseId: null,
          membershipPlanId: null,
          quantity: 1,
          unitPrice: artwork.price,
        });
      } else if (typeof item.productVariantId === "number") {
        const variant = await prisma.productVariant.findUnique({
          where: { id: item.productVariantId },
          include: { product: true },
        });
        if (!variant || !variant.product.isAvailable) {
          return res.status(404).json({
            success: false,
            message: `Product variant ${item.productVariantId} not found`,
          });
        }
        if (variant.stock < quantity) {
          return res.status(409).json({
            success: false,
            message: `Insufficient stock for ${variant.sku}`,
          });
        }
        const unit = variant.price.toNumber();
        subtotal += unit * quantity;
        orderItemsData.push({
          itemType: OrderItemType.PRODUCT,
          productVariantId: variant.id,
          ticketTypeId: null,
          artworkId: null,
          releaseId: null,
          membershipPlanId: null,
          quantity,
          unitPrice: variant.price,
        });
      } else if (typeof item.ticketTypeId === "number") {
        const ticketType = await prisma.ticketType.findUnique({
          where: { id: item.ticketTypeId },
          include: { event: true },
        });
        if (!ticketType || ticketType.event.status !== "PUBLISHED") {
          return res.status(404).json({
            success: false,
            message: `Ticket type ${item.ticketTypeId} not found`,
          });
        }
        const now = new Date();
        if (ticketType.salesStart && now < ticketType.salesStart) {
          return res.status(403).json({
            success: false,
            message: "Ticket sales have not opened yet",
          });
        }
        if (ticketType.salesEnd && now > ticketType.salesEnd) {
          return res.status(403).json({
            success: false,
            message: "Ticket sales have ended",
          });
        }
        const remaining = ticketType.quantity - ticketType.quantitySold;
        if (remaining < quantity) {
          return res.status(409).json({
            success: false,
            message: `Not enough tickets remaining for ${ticketType.name}`,
          });
        }
        orderItemsData.push({
          itemType: OrderItemType.TICKET,
          productVariantId: null,
          ticketTypeId: ticketType.id,
          artworkId: null,
          releaseId: null,
          membershipPlanId: null,
          quantity,
          unitPrice: ticketType.price,
        });
        subtotal += ticketType.price.toNumber() * quantity;
      } else if (typeof item.releaseId === "number") {
        const release = await prisma.release.findUnique({
          where: { id: item.releaseId },
          include: { accessPolicy: true },
        });
        if (
          !release ||
          release.publishStatus !== "PUBLISHED" ||
          !release.accessPolicy ||
          release.accessPolicy.accessMode !== "PAID" ||
          release.accessPolicy.price == null
        ) {
          return res.status(404).json({
            success: false,
            message: `Release ${item.releaseId} is not available for purchase`,
          });
        }
        orderItemsData.push({
          itemType: OrderItemType.RELEASE,
          productVariantId: null,
          ticketTypeId: null,
          artworkId: null,
          releaseId: release.id,
          membershipPlanId: null,
          quantity: 1,
          unitPrice: release.accessPolicy.price,
        });
        subtotal += release.accessPolicy.price.toNumber();
      } else if (typeof item.membershipPlanId === "number") {
        const plan = await prisma.membershipPlan.findUnique({
          where: { id: item.membershipPlanId },
        });
        if (!plan || !plan.active) {
          return res.status(404).json({
            success: false,
            message: `Membership plan ${item.membershipPlanId} not found`,
          });
        }
        orderItemsData.push({
          itemType: OrderItemType.MEMBERSHIP_PASS,
          productVariantId: null,
          ticketTypeId: null,
          artworkId: null,
          releaseId: null,
          membershipPlanId: plan.id,
          quantity: 1,
          unitPrice: plan.price,
        });
        subtotal += plan.price.toNumber();
      }
    }

    const fee =
      typeof deliveryFee === "number" && deliveryFee >= 0 ? deliveryFee : 0;
    const amount = subtotal + fee;

    const order = await prisma.order.create({
      data: {
        userId,
        status: "PENDING",
        paymentProvider: provider,
        amount,
        currency:
          process.env.NEXT_PUBLIC_CURRENCY?.replace(/^\$/, "USD") || "USD",
        phoneNumber: typeof phoneNumber === "string" ? phoneNumber : null,
        deliveryMethod: (deliveryMethod as DeliveryMethod) || null,
        deliveryAddress:
          typeof deliveryAddress === "string" ? deliveryAddress : null,
        packaging: (packaging as PackagingType) || null,
        deliveryFee: fee > 0 ? fee : null,
        items: {
          create: orderItemsData,
        },
      },
      include: { items: true },
    });

    if (provider === "PAYSTACK") {
      if (!isPaystackConfigured()) {
        return res.status(503).json({
          success: false,
          message:
            "Online payment is not configured. Set PAYSTACK_SECRET_KEY on the server.",
        });
      }
      if (!userEmail) {
        return res.status(400).json({
          success: false,
          message: "Your account must have an email address to pay online.",
        });
      }

      const reference = buildPaystackReference(order.id);
      const paystack = await initializeTransaction({
        email: userEmail,
        amount: order.amount.toNumber(),
        currency: order.currency,
        reference,
        callbackUrl: paystackCallbackUrl(reference),
        metadata: { orderId: order.id },
      });

      await prisma.order.update({
        where: { id: order.id },
        data: { paystackRef: reference },
      });

      return res.status(201).json({
        success: true,
        message: "Redirecting to payment…",
        data: {
          id: order.id,
          status: order.status,
          amount: order.amount.toNumber(),
          currency: order.currency,
          paystackRef: reference,
          authorizationUrl: paystack.authorization_url,
          accessCode: paystack.access_code,
          deliveryMethod: order.deliveryMethod,
          deliveryFee: order.deliveryFee?.toNumber() ?? null,
          items: order.items.map((oi) => ({
            id: oi.id,
            itemType: oi.itemType,
            productVariantId: oi.productVariantId,
            ticketTypeId: oi.ticketTypeId,
            artworkId: oi.artworkId,
            releaseId: oi.releaseId,
            membershipPlanId: oi.membershipPlanId,
            quantity: oi.quantity,
            unitPrice: oi.unitPrice.toNumber(),
          })),
        },
      });
    }

    return res.status(201).json({
      success: true,
      message: "Order created — complete payment to confirm.",
      data: {
        id: order.id,
        status: order.status,
        amount: order.amount.toNumber(),
        currency: order.currency,
        deliveryMethod: order.deliveryMethod,
        deliveryFee: order.deliveryFee?.toNumber() ?? null,
        items: order.items.map((oi) => ({
          id: oi.id,
          itemType: oi.itemType,
          productVariantId: oi.productVariantId,
          ticketTypeId: oi.ticketTypeId,
          artworkId: oi.artworkId,
          releaseId: oi.releaseId,
          membershipPlanId: oi.membershipPlanId,
          quantity: oi.quantity,
          unitPrice: oi.unitPrice.toNumber(),
        })),
      },
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
