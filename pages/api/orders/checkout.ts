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
import { promoteEventStatus } from "@/lib/data/events";
import {
  TicketInventoryError,
  releaseExpiredTicketReservations,
  reserveTickets,
  type ReservationLine,
} from "@/lib/ticketing/inventory";
import { fulfillOrder } from "@/lib/orders/fulfill";
import { sendOrderConfirmationEmail } from "@/lib/email/order-confirmation";
import { newRetrievalToken } from "@/lib/ticketing/retrieval";
import {
  buildPaystackReference,
  initializeTransaction,
  isPaystackConfigured,
  paystackCallbackUrl,
} from "@/lib/paystack";
import {
  CATALOG_CURRENCY,
  MUSIC_PAYMENT_CURRENCY,
  musicPaymentAmount,
  normalizeToUsd,
  usdToKes,
} from "@/lib/currency";

const DELIVERY_METHODS = new Set(Object.values(DeliveryMethod));
const PACKAGING_TYPES = new Set(Object.values(PackagingType));
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

interface CheckoutAttendee {
  name?: string;
  email?: string;
}

interface CheckoutItem {
  productVariantId?: number;
  ticketTypeId?: number;
  artworkId?: number;
  releaseId?: number;
  membershipPlanId?: number;
  quantity?: number;
  attendees?: CheckoutAttendee[];
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

/**
 * Only same-origin relative paths may be echoed back into the Paystack callback
 * URL, so a crafted returnPath can never redirect off-site.
 */
function validateReturnPath(path: unknown): string | undefined {
  if (typeof path !== "string") return undefined;
  if (!path.startsWith("/") || path.startsWith("//")) return undefined;
  if (path.includes("://") || path.length > 300) return undefined;
  return path;
}

/** Normalize a client-supplied attendee list to safe { name, email } objects. */
function normalizeAttendees(
  raw: unknown,
  quantity: number
): { name?: string; email?: string }[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, quantity).map((entry) => {
    const a = (entry ?? {}) as CheckoutAttendee;
    const name =
      typeof a.name === "string" ? a.name.trim().slice(0, 120) : undefined;
    const email =
      typeof a.email === "string" ? a.email.trim().slice(0, 200) : undefined;
    return { name: name || undefined, email: email || undefined };
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
  const userId = session?.user?.id ?? null;
  const userEmail = session?.user?.email ?? null;

  const {
    items,
    deliveryMethod,
    deliveryAddress,
    packaging,
    customerName: rawCustomerName,
    phoneNumber: rawPhoneNumber,
    deliveryNotes: rawDeliveryNotes,
    guestName: rawGuestName,
    guestEmail: rawGuestEmail,
    guestPhone: rawGuestPhone,
    returnPath: rawReturnPath,
  } = req.body as {
    items?: CheckoutItem[];
    deliveryMethod?: string;
    deliveryAddress?: string;
    packaging?: string;
    customerName?: string;
    deliveryNotes?: string;
    phoneNumber?: string;
    guestName?: string;
    guestEmail?: string;
    guestPhone?: string;
    returnPath?: string;
  };

  const returnPath = validateReturnPath(rawReturnPath);

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
    return res.status(400).json({ success: false, message: "Invalid deliveryMethod" });
  }

  if (packaging != null && !PACKAGING_TYPES.has(packaging as PackagingType)) {
    return res.status(400).json({ success: false, message: "Invalid packaging" });
  }

  const allTickets = items.every(
    (item) => typeof item.ticketTypeId === "number"
  );

  // Guests may only check out pure ticket orders.
  if (!userId && !allTickets) {
    return res.status(401).json({
      success: false,
      message:
        "Please sign in to buy merch, artwork, or music. Event tickets can be bought as a guest.",
    });
  }

  const hasPhysicalItem = items.some(
    (item) =>
      typeof item.productVariantId === "number" ||
      typeof item.artworkId === "number"
  );

  // Guest ticket buyer contact (email required for delivery/retrieval).
  const guestName =
    typeof rawGuestName === "string" ? rawGuestName.trim() : "";
  const guestEmail =
    typeof rawGuestEmail === "string" ? rawGuestEmail.trim() : "";
  const guestPhone =
    typeof rawGuestPhone === "string" ? rawGuestPhone.trim() : "";
  if (!userId && allTickets) {
    if (!EMAIL_RE.test(guestEmail) || guestEmail.length > 200) {
      return res.status(400).json({
        success: false,
        message: "A valid email is required so we can send your tickets.",
      });
    }
    if (guestName.length > 120) {
      return res.status(400).json({ success: false, message: "Name is too long" });
    }
    if (guestPhone.length > 40) {
      return res.status(400).json({ success: false, message: "Phone is too long" });
    }
  }

  const customerName =
    typeof rawCustomerName === "string" ? rawCustomerName.trim() : "";
  const phoneNumber =
    typeof rawPhoneNumber === "string" ? rawPhoneNumber.trim() : "";
  const deliveryNotes =
    typeof rawDeliveryNotes === "string" ? rawDeliveryNotes.trim() : "";

  if (hasPhysicalItem) {
    if (!deliveryMethod || !DELIVERY_METHODS.has(deliveryMethod as DeliveryMethod)) {
      return res.status(400).json({
        success: false,
        message: "Choose delivery or collection",
      });
    }
    if (!customerName || customerName.length > 120) {
      return res.status(400).json({
        success: false,
        message: "Your name is required for fulfilment",
      });
    }
    if (!/^[+\d][\d\s\-().]{4,24}$/.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: "A valid phone number is required for fulfilment",
      });
    }
    if (
      (deliveryMethod as DeliveryMethod) !== "LOCAL_PICKUP" &&
      (!deliveryAddress ||
        typeof deliveryAddress !== "string" ||
        !deliveryAddress.trim() ||
        deliveryAddress.trim().length > 500)
    ) {
      return res.status(400).json({
        success: false,
        message: "A delivery location is required for delivery orders",
      });
    }
    if (deliveryNotes.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Delivery notes are too long",
      });
    }
  }

  const provider: PaymentProvider = "PAYSTACK";

  try {
    await releaseExpiredReservations();
    await releaseExpiredTicketReservations();

    const orderItemsData: {
      itemType: OrderItemType;
      productVariantId: number | null;
      ticketTypeId: number | null;
      artworkId: number | null;
      releaseId: number | null;
      membershipPlanId: number | null;
      quantity: number;
      unitPrice: Prisma.Decimal;
      attendees?: Prisma.InputJsonValue;
    }[] = [];
    const ticketLines: ReservationLine[] = [];

    let subtotal = 0;

    for (const item of items) {
      const quantity = item.quantity ?? 1;

      if (typeof item.artworkId === "number") {
        const artwork = await prisma.artwork.findUnique({
          where: { id: item.artworkId },
        });
        if (!artwork || !artwork.isAvailable || artwork.price.toNumber() <= 0) {
          return res.status(404).json({
            success: false,
            message: `Artwork ${item.artworkId} is not available for purchase`,
          });
        }
        const reservedByBuyer =
          artwork.status === "RESERVED" && artwork.reservedByUserId === userId;
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
        if (!ticketType) {
          return res.status(404).json({
            success: false,
            message: `Ticket type ${item.ticketTypeId} not found`,
          });
        }
        await promoteEventStatus(ticketType.event);
        if (
          ticketType.event.status !== "PUBLISHED" ||
          ticketType.event.ticketMode !== "TICKETED" ||
          ticketType.archivedAt
        ) {
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
        const remaining =
          ticketType.quantity - ticketType.quantitySold - ticketType.quantityReserved;
        if (remaining < quantity) {
          return res.status(409).json({
            success: false,
            message: `Not enough tickets remaining for ${ticketType.name}`,
          });
        }
        const attendees = normalizeAttendees(item.attendees, quantity);
        orderItemsData.push({
          itemType: OrderItemType.TICKET,
          productVariantId: null,
          ticketTypeId: ticketType.id,
          artworkId: null,
          releaseId: null,
          membershipPlanId: null,
          quantity,
          unitPrice: ticketType.price,
          attendees:
            attendees.length > 0
              ? (attendees as Prisma.InputJsonValue)
              : undefined,
        });
        ticketLines.push({ ticketTypeId: ticketType.id, quantity });
        subtotal += ticketType.price.toNumber() * quantity;
      } else if (typeof item.releaseId === "number") {
        if (!userId) {
          return res.status(401).json({
            success: false,
            message: "Sign in to purchase music releases",
          });
        }
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
        const existingUnlock = await prisma.releaseUnlock.findUnique({
          where: { userId_releaseId: { userId, releaseId: release.id } },
        });
        if (existingUnlock) {
          return res.status(409).json({
            success: false,
            message: "You already own this release",
          });
        }
        const storedCurrency = release.accessPolicy.currency ?? "USD";
        const usdPrice = normalizeToUsd(
          release.accessPolicy.price.toNumber(),
          storedCurrency
        );
        const kesCharge = musicPaymentAmount(usdPrice);
        orderItemsData.push({
          itemType: OrderItemType.RELEASE,
          productVariantId: null,
          ticketTypeId: null,
          artworkId: null,
          releaseId: release.id,
          membershipPlanId: null,
          quantity: 1,
          unitPrice: new Prisma.Decimal(kesCharge),
        });
        subtotal += kesCharge;
      } else if (typeof item.membershipPlanId === "number") {
        if (!userId) {
          return res.status(401).json({
            success: false,
            message: "Sign in to purchase a membership",
          });
        }
        const plan = await prisma.membershipPlan.findUnique({
          where: { id: item.membershipPlanId },
        });
        if (!plan || !plan.active) {
          return res.status(404).json({
            success: false,
            message: `Membership plan ${item.membershipPlanId} not found`,
          });
        }
        const planCurrency = plan.currency ?? "USD";
        const usdPrice = normalizeToUsd(plan.price.toNumber(), planCurrency);
        const kesCharge = musicPaymentAmount(usdPrice);
        orderItemsData.push({
          itemType: OrderItemType.MEMBERSHIP_PASS,
          productVariantId: null,
          ticketTypeId: null,
          artworkId: null,
          releaseId: null,
          membershipPlanId: plan.id,
          quantity: 1,
          unitPrice: new Prisma.Decimal(kesCharge),
        });
        subtotal += kesCharge;
      }
    }

    const fee = 0;
    const amount = subtotal + fee;

    const hasMusicItem = orderItemsData.some(
      (oi) =>
        oi.itemType === OrderItemType.RELEASE ||
        oi.itemType === OrderItemType.MEMBERSHIP_PASS
    );
    const hasNonMusicItem = orderItemsData.some(
      (oi) =>
        oi.itemType !== OrderItemType.RELEASE &&
        oi.itemType !== OrderItemType.MEMBERSHIP_PASS
    );
    if (hasMusicItem && hasNonMusicItem) {
      return res.status(400).json({
        success: false,
        message:
          "Music purchases must be checked out separately from shop and event items",
      });
    }

    const orderCurrency = hasMusicItem ? MUSIC_PAYMENT_CURRENCY : CATALOG_CURRENCY;
    const isGuestTicketOrder = !userId && allTickets;
    const hasTicketItem = orderItemsData.some(
      (oi) => oi.itemType === OrderItemType.TICKET
    );
    const isFreeTicketOrder = hasTicketItem && amount === 0 && allTickets;

    // Create the order and atomically reserve ticket stock in one transaction.
    let order;
    try {
      order = await prisma.$transaction(async (tx) => {
        const created = await tx.order.create({
          data: {
            userId,
            status: "PENDING",
            paymentStatus: isFreeTicketOrder ? "NOT_REQUIRED" : "PENDING",
            source: "ONLINE",
            paymentProvider: isFreeTicketOrder ? null : provider,
            amount,
            currency: orderCurrency,
            guestName: isGuestTicketOrder ? guestName || null : null,
            guestEmail: isGuestTicketOrder ? guestEmail || null : null,
            guestPhone: isGuestTicketOrder ? guestPhone || null : null,
            customerName: hasPhysicalItem ? customerName : null,
            phoneNumber: hasPhysicalItem ? phoneNumber : null,
            deliveryNotes:
              hasPhysicalItem && deliveryNotes ? deliveryNotes : null,
            deliveryMethod: hasPhysicalItem
              ? (deliveryMethod as DeliveryMethod)
              : null,
            deliveryAddress:
              hasPhysicalItem &&
              typeof deliveryAddress === "string" &&
              (deliveryMethod as DeliveryMethod) !== "LOCAL_PICKUP"
                ? deliveryAddress.trim()
                : null,
            packaging: hasPhysicalItem
              ? (packaging as PackagingType) || null
              : null,
            deliveryFee: null,
            items: { create: orderItemsData },
          },
          include: { items: true },
        });
        if (ticketLines.length > 0) {
          await reserveTickets(tx, created.id, ticketLines);
        }
        return created;
      });
    } catch (err) {
      if (err instanceof TicketInventoryError) {
        return res.status(409).json({ success: false, message: err.message });
      }
      throw err;
    }

    // Guest/free ticket orders get a secure retrieval token so tickets are
    // never exposed by sequential id or email-only lookup.
    if (isGuestTicketOrder || isFreeTicketOrder) {
      const { token, expiresAt } = newRetrievalToken();
      await prisma.order.update({
        where: { id: order.id },
        data: { retrievalToken: token, retrievalTokenExpiresAt: expiresAt },
      });
    }

    // Free ticket order: issue immediately, no payment provider.
    if (isFreeTicketOrder) {
      await fulfillOrder(order.id, { paymentStatus: "NOT_REQUIRED" });
      try {
        await sendOrderConfirmationEmail(order.id);
      } catch (emailErr) {
        console.error("Free-ticket confirmation email failed:", emailErr);
      }
      const issued = await prisma.order.findUnique({
        where: { id: order.id },
        include: { items: true, tickets: true },
      });
      return res.status(201).json({
        success: true,
        message: "Free tickets issued — check your email.",
        data: {
          id: order.id,
          status: "PAID",
          paymentStatus: "NOT_REQUIRED",
          amount: 0,
          currency: order.currency,
          free: true,
          tickets: (issued?.tickets ?? []).map((t) => ({
            code: t.code,
            ticketTypeId: t.ticketTypeId,
          })),
          items: order.items.map((oi) => ({
            id: oi.id,
            itemType: oi.itemType,
            ticketTypeId: oi.ticketTypeId,
            quantity: oi.quantity,
            unitPrice: oi.unitPrice.toNumber(),
          })),
        },
      });
    }

    if (provider === "PAYSTACK") {
      if (!isPaystackConfigured()) {
        return res.status(503).json({
          success: false,
          message:
            "Online payment is not configured. Set PAYSTACK_SECRET_KEY on the server.",
        });
      }
      const payEmail = userEmail ?? guestEmail;
      if (!payEmail) {
        return res.status(400).json({
          success: false,
          message: "An email address is required to pay online.",
        });
      }

      const reference = buildPaystackReference(order.id);
      const chargeCurrency = MUSIC_PAYMENT_CURRENCY; // "KES"
      const chargeAmount =
        order.currency === chargeCurrency
          ? order.amount.toNumber()
          : usdToKes(order.amount.toNumber());

      const paystack = await initializeTransaction({
        email: payEmail,
        amount: chargeAmount,
        currency: chargeCurrency,
        reference,
        callbackUrl: paystackCallbackUrl(reference, returnPath),
        metadata: { orderId: order.id },
      });

      await prisma.order.update({
        where: { id: order.id },
        data: {
          paystackRef: reference,
          paystackChargeAmount: chargeAmount,
          paystackChargeCurrency: chargeCurrency,
        },
      });

      return res.status(201).json({
        success: true,
        message: "Redirecting to payment…",
        data: {
          id: order.id,
          status: order.status,
          amount: order.amount.toNumber(),
          currency: order.currency,
          chargeAmount,
          chargeCurrency,
          deliveryFree: true,
          paystackRef: reference,
          authorizationUrl: paystack.authorization_url,
          accessCode: paystack.access_code,
          deliveryMethod: order.deliveryMethod,
          deliveryFee: null,
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
        deliveryFree: true,
        deliveryMethod: order.deliveryMethod,
        deliveryFee: null,
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
