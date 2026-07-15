import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

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

  try {
    const events = await prisma.event.findMany({
      where: {
        status: { in: ["PUBLISHED", "COMPLETED"] },
      },
      orderBy: { startsAt: "desc" },
      include: {
        ticketTypes: {
          orderBy: { price: "asc" },
        },
      },
    });

    const data = events.map((event) => ({
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
    }));

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Error listing events:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
