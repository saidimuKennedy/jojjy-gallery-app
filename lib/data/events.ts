import type { Event, EventStatus } from "@prisma/client";
import prisma from "@/lib/prisma";

/**
 * Lazy "auto-promote on read" for event status, mirroring the music release
 * scheduled-publish pattern. Only ever promotes the row already in hand:
 * - DRAFT + publishAt passed → PUBLISHED
 * - PUBLISHED + endsAt passed → COMPLETED
 * A CANCELLED event is never touched, and events with no endsAt are never
 * auto-completed (the ambiguity is left to the staff to resolve).
 */
export async function promoteEventStatus(
  event: Pick<Event, "id" | "status" | "publishAt" | "endsAt">,
  now: Date = new Date()
): Promise<Event["status"]> {
  if (event.status === "CANCELLED") return event.status;

  let next: EventStatus = event.status;
  if (
    next === "DRAFT" &&
    event.publishAt &&
    event.publishAt.getTime() <= now.getTime()
  ) {
    next = "PUBLISHED";
  } else if (
    next === "PUBLISHED" &&
    event.endsAt &&
    event.endsAt.getTime() <= now.getTime()
  ) {
    next = "COMPLETED";
  }

  if (next !== event.status) {
    await prisma.event.update({
      where: { id: event.id },
      data: { status: next },
    });
    event.status = next;
  }

  return event.status;
}

export async function getPublishedEvents() {
  const now = new Date();

  // Fetch the rows this request will serve, plus due-scheduled DRAFTs so they
  // can be auto-promoted here rather than scanned globally.
  const events = await prisma.event.findMany({
    where: {
      OR: [
        { status: "PUBLISHED" },
        { status: "COMPLETED" },
        { status: "DRAFT", publishAt: { lte: now } },
      ],
    },
    orderBy: { startsAt: "desc" },
    include: {
      ticketTypes: {
        orderBy: { price: "asc" },
      },
    },
  });

  for (const event of events) {
    await promoteEventStatus(event, now);
  }

  const visible = events.filter(
    (event) => event.status === "PUBLISHED" || event.status === "COMPLETED"
  );

  return visible.map((event) => ({
    ...event,
    publishAt: event.publishAt ? event.publishAt.toISOString() : null,
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
