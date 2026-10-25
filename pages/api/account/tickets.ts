import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

/**
 * Ownership-scoped ticket wallet: every ticket the signed-in customer owns,
 * with event context. Tickets never expire from here — codes remain
 * retrievable after leaving the confirmation page.
 */
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
    const tickets = await prisma.ticket.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        ticketType: {
          select: {
            id: true,
            name: true,
            price: true,
            entryLabel: true,
            isPremium: true,
            event: {
              select: {
                id: true,
                title: true,
                slug: true,
                startsAt: true,
                endsAt: true,
                venue: true,
                imageUrl: true,
                timezone: true,
                category: true,
                tagline: true,
                status: true,
              },
            },
          },
        },
        order: { select: { id: true, status: true, createdAt: true } },
      },
    });

    return res.status(200).json({
      success: true,
      data: tickets.map((t) => ({
        id: t.id,
        code: t.code,
        status: t.status,
        holderName: t.holderName,
        checkedInAt: t.checkedInAt ? t.checkedInAt.toISOString() : null,
        createdAt: t.createdAt.toISOString(),
        purchasedAt: t.order.createdAt.toISOString(),
        ticketType: t.ticketType.name,
        price: t.ticketType.price.toNumber(),
        entryLabel: t.ticketType.entryLabel,
        isPremium: t.ticketType.isPremium,
        event: {
          title: t.ticketType.event.title,
          slug: t.ticketType.event.slug,
          startsAt: t.ticketType.event.startsAt.toISOString(),
          endsAt: t.ticketType.event.endsAt
            ? t.ticketType.event.endsAt.toISOString()
            : null,
          venue: t.ticketType.event.venue,
          imageUrl: t.ticketType.event.imageUrl,
          timezone: t.ticketType.event.timezone,
          category: t.ticketType.event.category,
          tagline: t.ticketType.event.tagline,
          status: t.ticketType.event.status,
        },
        orderId: t.order.id,
        orderStatus: t.order.status,
      })),
    });
  } catch (error) {
    console.error("Error listing tickets:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
