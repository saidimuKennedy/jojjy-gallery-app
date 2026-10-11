import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

/**
 * Ticket inventory: reserve → finalize → release.
 *
 * Invariant enforced by every write here:
 *   quantitySold + quantityReserved <= quantity
 *
 * Reservations are created at checkout (before payment) with an expiry. They are
 * "consumed" on paid/complimentary issuance (reserved → sold) and "released" on
 * payment failure/cancellation, timeout, or explicit cancellation. Capacity is
 * claimed with a single conditional UPDATE so concurrent checkouts serialize on
 * the row lock and can never oversell.
 */

/** Minutes a checkout hold lasts before it returns to the pool. */
export const TICKET_RESERVATION_HOLD_MINUTES = 30;

type Client = Prisma.TransactionClient;

export class TicketInventoryError extends Error {
  code: "NOT_FOUND" | "NOT_ENOUGH_TICKETS" | "SALES_CLOSED" | "OVERSOLD";
  constructor(
    code: TicketInventoryError["code"],
    message: string
  ) {
    super(message);
    this.name = "TicketInventoryError";
    this.code = code;
  }
}

export interface ReservationLine {
  ticketTypeId: number;
  quantity: number;
}

/**
 * Release expired ACTIVE reservations, returning their stock to the pool.
 * Safe to call lazily from any read/checkout path. Returns rows released.
 */
export async function releaseExpiredTicketReservations(
  tx: Client | typeof prisma = prisma,
  now: Date = new Date()
): Promise<number> {
  const expired = await tx.ticketReservation.findMany({
    where: { status: "ACTIVE", expiresAt: { lt: now } },
    select: { id: true, ticketTypeId: true, quantity: true },
  });
  if (expired.length === 0) return 0;

  const byType = new Map<number, number>();
  for (const r of expired) {
    byType.set(r.ticketTypeId, (byType.get(r.ticketTypeId) ?? 0) + r.quantity);
  }

  await tx.ticketReservation.updateMany({
    where: { id: { in: expired.map((r) => r.id) } },
    data: { status: "RELEASED", releasedAt: now },
  });
  for (const [ticketTypeId, qty] of byType) {
    await tx.ticketType.update({
      where: { id: ticketTypeId },
      data: { quantityReserved: { decrement: qty } },
    });
  }
  return expired.length;
}

/**
 * Atomically reserve stock for the given lines against an order. Throws
 * TicketInventoryError(NOT_ENOUGH_TICKETS) if any line cannot be fully claimed.
 */
export async function reserveTickets(
  tx: Client,
  orderId: string,
  lines: ReservationLine[]
): Promise<void> {
  const expiresAt = new Date(
    Date.now() + TICKET_RESERVATION_HOLD_MINUTES * 60 * 1000
  );

  for (const line of lines) {
    if (line.quantity <= 0) continue;
    const affected = await tx.$executeRaw`
      UPDATE "ticket_types"
      SET "quantityReserved" = "quantityReserved" + ${line.quantity}
      WHERE "id" = ${line.ticketTypeId}
        AND "archivedAt" IS NULL
        AND "quantity" - "quantitySold" - "quantityReserved" >= ${line.quantity}
    `;
    if (affected === 0) {
      throw new TicketInventoryError(
        "NOT_ENOUGH_TICKETS",
        "Not enough tickets remaining — they may have just sold out."
      );
    }
    await tx.ticketReservation.create({
      data: {
        ticketTypeId: line.ticketTypeId,
        orderId,
        quantity: line.quantity,
        expiresAt,
      },
    });
  }
}

/**
 * Consume an order's ACTIVE reservations, converting reserved stock into sold
 * stock inside the payment/issuance transaction. Returns the consumed lines so
 * the caller can create tickets. Throws OVERSOLD if the invariant would break.
 */
export async function finalizeTicketReservations(
  tx: Client,
  orderId: string
): Promise<ReservationLine[]> {
  const reservations = await tx.ticketReservation.findMany({
    where: { orderId, status: "ACTIVE" },
  });

  const consumed: ReservationLine[] = [];
  for (const r of reservations) {
    const updated = await tx.ticketType.update({
      where: { id: r.ticketTypeId },
      data: {
        quantityReserved: { decrement: r.quantity },
        quantitySold: { increment: r.quantity },
      },
    });
    if (updated.quantitySold > updated.quantity) {
      throw new TicketInventoryError(
        "OVERSOLD",
        "Ticket allocation was exceeded while finalizing payment."
      );
    }
    await tx.ticketReservation.update({
      where: { id: r.id },
      data: { status: "CONSUMED" },
    });
    consumed.push({ ticketTypeId: r.ticketTypeId, quantity: r.quantity });
  }
  return consumed;
}

/** Release an order's ACTIVE reservations (payment failed/cancelled/expired). */
export async function releaseOrderReservations(
  tx: Client | typeof prisma,
  orderId: string,
  now: Date = new Date()
): Promise<void> {
  const active = await tx.ticketReservation.findMany({
    where: { orderId, status: "ACTIVE" },
    select: { id: true, ticketTypeId: true, quantity: true },
  });
  if (active.length === 0) return;

  const byType = new Map<number, number>();
  for (const r of active) {
    byType.set(r.ticketTypeId, (byType.get(r.ticketTypeId) ?? 0) + r.quantity);
  }
  await tx.ticketReservation.updateMany({
    where: { id: { in: active.map((r) => r.id) } },
    data: { status: "RELEASED", releasedAt: now },
  });
  for (const [ticketTypeId, qty] of byType) {
    await tx.ticketType.update({
      where: { id: ticketTypeId },
      data: { quantityReserved: { decrement: qty } },
    });
  }
}

/**
 * A ticket type can only be shrunk down to what is already sold or reserved.
 * Used by admin/CRM edits. Returns an error message, or null when allowed.
 */
export function capacityEditError(
  ticketType: { quantity: number; quantitySold: number; quantityReserved: number },
  nextQuantity: number,
  nextReserved = ticketType.quantityReserved
): string | null {
  const floor = ticketType.quantitySold + nextReserved;
  if (nextQuantity < floor) {
    return `Quantity cannot be lower than sold + reserved (${floor}).`;
  }
  return null;
}
