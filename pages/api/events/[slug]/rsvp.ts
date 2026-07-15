import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST" && req.method !== "DELETE") {
    res.setHeader("Allow", ["POST", "DELETE"]);
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

  const { slug } = req.query;
  if (!slug || typeof slug !== "string") {
    return res
      .status(400)
      .json({ success: false, message: "Invalid event slug" });
  }

  try {
    const event = await prisma.event.findUnique({
      where: { slug },
      select: { id: true, status: true },
    });

    if (!event || event.status === "DRAFT" || event.status === "CANCELLED") {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }

    const eventId = event.id;

    if (req.method === "POST") {
      const status =
        req.body?.status === "INTERESTED" ? "INTERESTED" : "GOING";

      const rsvp = await prisma.eventRsvp.upsert({
        where: {
          userId_eventId: { userId, eventId },
        },
        create: { userId, eventId, status },
        update: { status },
      });

      return res.status(200).json({
        success: true,
        data: {
          id: rsvp.id,
          status: rsvp.status,
          eventId: rsvp.eventId,
        },
      });
    }

    // DELETE — cancel RSVP
    const existing = await prisma.eventRsvp.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });

    if (!existing || existing.status === "CANCELLED") {
      return res.status(404).json({
        success: false,
        message: "No active RSVP found",
      });
    }

    await prisma.eventRsvp.update({
      where: { id: existing.id },
      data: { status: "CANCELLED" },
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error handling event RSVP:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
