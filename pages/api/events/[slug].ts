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

  const { slug } = req.query;
  if (!slug || typeof slug !== "string") {
    return res
      .status(400)
      .json({ success: false, message: "Invalid event slug" });
  }

  try {
    const event = await prisma.event.findUnique({
      where: { slug },
      include: {
        ticketTypes: { orderBy: { price: "asc" } },
        mediaFiles: { orderBy: { order: "asc" } },
        pressMentions: { orderBy: { publishedAt: "desc" } },
      },
    });

    if (
      !event ||
      (event.status !== "PUBLISHED" && event.status !== "COMPLETED")
    ) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }

    const session = await getServerSession(req, res, authOptions);
    const userId = session?.user?.id;

    let userRsvp: { status: string } | null = null;
    if (userId) {
      const rsvp = await prisma.eventRsvp.findUnique({
        where: {
          userId_eventId: { userId, eventId: event.id },
        },
      });
      if (rsvp && rsvp.status !== "CANCELLED") {
        userRsvp = { status: rsvp.status };
      }
    }

    const data = {
      ...event,
      startsAt: event.startsAt.toISOString(),
      endsAt: event.endsAt ? event.endsAt.toISOString() : null,
      artistTalkAt: event.artistTalkAt
        ? event.artistTalkAt.toISOString()
        : null,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
      ticketTypes: event.ticketTypes.map((tt) => ({
        ...tt,
        price: tt.price.toNumber(),
        salesStart: tt.salesStart ? tt.salesStart.toISOString() : null,
        salesEnd: tt.salesEnd ? tt.salesEnd.toISOString() : null,
        createdAt: tt.createdAt.toISOString(),
        updatedAt: tt.updatedAt.toISOString(),
      })),
      mediaFiles: event.mediaFiles.map((mf) => ({
        ...mf,
        createdAt: mf.createdAt.toISOString(),
        updatedAt: mf.updatedAt.toISOString(),
      })),
      pressMentions: event.pressMentions.map((pm) => ({
        ...pm,
        publishedAt: pm.publishedAt ? pm.publishedAt.toISOString() : null,
        createdAt: pm.createdAt.toISOString(),
        updatedAt: pm.updatedAt.toISOString(),
      })),
      userHasRsvp: !!userRsvp,
      userRsvpStatus: userRsvp?.status ?? null,
    };

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Error fetching event:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
