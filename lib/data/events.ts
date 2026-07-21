import prisma from "@/lib/prisma";

export async function getPublishedEvents() {
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

  return events.map((event) => ({
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
}
