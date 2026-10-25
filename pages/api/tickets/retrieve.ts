import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { promoteEventStatus } from "@/lib/data/events";
import { completeOrderFromPaystackReference } from "@/lib/orders/complete-payment";

/**
 * Guest ticket retrieval. Two verified paths:
 *  - order reference + the email used at checkout, or
 *  - the one-time secure token emailed with the confirmation.
 * Never exposes tickets by sequential id or unverified email alone, and never
 * returns other buyers' PII.
 */
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

  const { reference, email, token } = req.body as {
    reference?: string;
    email?: string;
    token?: string;
  };

  const notFound = () =>
    res.status(404).json({
      success: false,
      message: "We could not find tickets for those details.",
    });

  try {
    let orderId: string | null = null;

    if (typeof token === "string" && token.trim()) {
      const tokenOrder = await prisma.order.findUnique({
        where: { retrievalToken: token.trim() },
        select: { id: true, retrievalTokenExpiresAt: true },
      });
      if (
        !tokenOrder ||
        !tokenOrder.retrievalTokenExpiresAt ||
        tokenOrder.retrievalTokenExpiresAt.getTime() < Date.now()
      ) {
        return notFound();
      }
      orderId = tokenOrder.id;
    } else if (typeof reference === "string" && reference.trim()) {
      const ref = reference.trim();
      const refOrder = await prisma.order.findFirst({
        where: { OR: [{ id: ref }, { paystackRef: ref }] },
        select: { id: true, guestEmail: true },
      });
      if (!refOrder) return notFound();

      const providedEmail =
        typeof email === "string" ? email.trim().toLowerCase() : "";
      const ownerEmail = (refOrder.guestEmail ?? "").toLowerCase();
      if (!providedEmail || providedEmail !== ownerEmail) {
        return notFound();
      }
      orderId = refOrder.id;
    } else {
      return res.status(400).json({
        success: false,
        message: "Provide an order reference and email, or a retrieval token.",
      });
    }

    const pending = await prisma.order.findUnique({
      where: { id: orderId },
      select: { status: true, paystackRef: true },
    });
    if (!pending) return notFound();

    // Guest checkout redirects here before any authenticated confirmation page
    // can run. Verify the provider reference server-side once, using the same
    // completion path as the webhook, then re-read the issued tickets.
    if (pending.status === "PENDING" && pending.paystackRef) {
      try {
        await completeOrderFromPaystackReference(pending.paystackRef);
      } catch {
        return res.status(409).json({
          success: false,
          message: "Tickets are issued once payment is confirmed.",
        });
      }
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { ticketType: { include: { event: true } } } },
        tickets: { include: { ticketType: { include: { event: true } } } },
      },
    });
    if (!order) return notFound();

    if (order.status !== "PAID") {
      return res.status(409).json({
        success: false,
        message: "Tickets are issued once payment is confirmed.",
      });
    }

    // Group tickets by event with operational, non-secret details.
    const byEvent = new Map<
      number,
      {
        event: {
          id: number;
          title: string;
          slug: string;
          venue: string | null;
          startsAt: string;
          endsAt: string | null;
          imageUrl: string | null;
          timezone: string;
          category: string | null;
          tagline: string | null;
          status: string;
        };
        tickets: {
          id: string;
          price: number;
          entryLabel: string | null;
          isPremium: boolean;
          code: string;
          ticketType: string;
          holderName: string | null;
          status: string;
          checkedInAt: string | null;
        }[];
      }
    >();

    for (const t of order.tickets) {
      const event = t.ticketType.event;
      await promoteEventStatus(event);
      const key = event.id;
      if (!byEvent.has(key)) {
        byEvent.set(key, {
          event: {
            id: event.id,
            title: event.title,
            slug: event.slug,
            venue: event.venue,
            startsAt: event.startsAt.toISOString(),
            endsAt: event.endsAt ? event.endsAt.toISOString() : null,
            imageUrl: event.imageUrl,
            timezone: event.timezone,
            category: event.category,
            tagline: event.tagline,
            status: event.status,
          },
          tickets: [],
        });
      }
      byEvent.get(key)!.tickets.push({
        id: t.id,
        price: t.ticketType.price.toNumber(),
        entryLabel: t.ticketType.entryLabel,
        isPremium: t.ticketType.isPremium,
        code: t.code,
        ticketType: t.ticketType.name,
        holderName: t.holderName,
        status: t.status,
        checkedInAt: t.checkedInAt ? t.checkedInAt.toISOString() : null,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        orderRef: order.id,
        orderShort: order.id.slice(0, 8),
        purchasedAt: order.createdAt.toISOString(),
        events: [...byEvent.values()],
      },
    });
  } catch (error) {
    console.error("Error retrieving tickets:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
