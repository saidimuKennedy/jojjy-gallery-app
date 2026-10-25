import { OrderItemType, PaymentStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { generateTicketCode } from "@/lib/orders/ticket-code";
import { grantOrExtendMembership } from "@/lib/music/membership";

export class FulfillmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FulfillmentError";
  }
}

export interface FulfillOptions {
  /** Payment state to set once fulfilled. Free/complimentary orders pass
   * NOT_REQUIRED; paid orders default to SUCCESS. */
  paymentStatus?: PaymentStatus;
}

function holderFrom(
  attendee: unknown,
  order: {
    guestName: string | null;
    guestEmail: string | null;
    customerName: string | null;
    user: { email: string } | null;
  }
): { holderName: string | null; holderEmail: string | null } {
  const a = (attendee ?? {}) as { name?: string; email?: string };
  const name =
    (typeof a.name === "string" && a.name.trim()) ||
    order.guestName ||
    order.customerName ||
    null;
  const email =
    (typeof a.email === "string" && a.email.trim()) ||
    order.guestEmail ||
    order.user?.email ||
    null;
  return { holderName: name, holderEmail: email };
}

export async function fulfillOrder(
  orderId: string,
  options: FulfillOptions = {}
): Promise<void> {
  const finalPaymentStatus: PaymentStatus =
    options.paymentStatus ?? "SUCCESS";

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { email: true } },
        items: {
          include: {
            artwork: true,
            ticketType: { include: { event: true } },
            productVariant: { include: { product: true } },
          },
        },
      },
    });

    if (!order) {
      throw new FulfillmentError(`Order ${orderId} not found`);
    }

    if (order.status === "PAID") {
      return;
    }

    if (order.status !== "PENDING") {
      throw new FulfillmentError(
        `Order ${orderId} cannot be fulfilled (status: ${order.status})`
      );
    }

    // Consume pre-payment ticket reservations for this order (if any).
    const reservations = await tx.ticketReservation.findMany({
      where: { orderId, status: "ACTIVE" },
      orderBy: { createdAt: "asc" },
    });
    const reservationQueues = new Map<
      number,
      (typeof reservations)[number][]
    >();
    for (const reservation of reservations) {
      const queue = reservationQueues.get(reservation.ticketTypeId) ?? [];
      queue.push(reservation);
      reservationQueues.set(reservation.ticketTypeId, queue);
    }

    for (const item of order.items) {
      switch (item.itemType) {
        case OrderItemType.ARTWORK: {
          if (!item.artworkId) break;
          // Atomic claim: the guarded updateMany succeeds for exactly one
          // concurrent transaction, so two buyers can never both purchase the
          // same original (check-then-update would race under concurrency).
          const claimed = await tx.artwork.updateMany({
            where: {
              id: item.artworkId,
              isAvailable: true,
              OR: [
                { status: "AVAILABLE" },
                { status: "RESERVED", reservedByUserId: order.userId },
              ],
            },
            data: {
              status: "SOLD",
              isAvailable: false,
              reservedByUserId: null,
              reservedUntil: null,
            },
          });
          if (claimed.count === 0) {
            throw new FulfillmentError(
              `Artwork ${item.artworkId} is no longer available`
            );
          }
          break;
        }
        case OrderItemType.TICKET: {
          if (!item.ticketTypeId) break;
          const ticketType = await tx.ticketType.findUnique({
            where: { id: item.ticketTypeId },
          });
          if (!ticketType) {
            throw new FulfillmentError(`Ticket type ${item.ticketTypeId} not found`);
          }

          const queue = reservationQueues.get(item.ticketTypeId);
          const reservation = queue?.shift();
          if (reservation) {
            if (reservation.quantity !== item.quantity) {
              throw new FulfillmentError(
                `Ticket reservation mismatch for ${ticketType.name}`
              );
            }
            // reserved → sold, under the row lock.
            const updatedType = await tx.ticketType.update({
              where: { id: item.ticketTypeId },
              data: {
                quantityReserved: { decrement: reservation.quantity },
                quantitySold: { increment: reservation.quantity },
              },
            });
            if (updatedType.quantitySold > updatedType.quantity) {
              throw new FulfillmentError(
                `Not enough tickets for ${ticketType.name}`
              );
            }
            await tx.ticketReservation.update({
              where: { id: reservation.id },
              data: { status: "CONSUMED" },
            });
          } else {
            // No live reservation (expired hold / legacy): atomically claim
            // available capacity, also respecting other active reservations.
            const claimed = await tx.$executeRaw`
              UPDATE "ticket_types"
              SET "quantitySold" = "quantitySold" + ${item.quantity}
              WHERE "id" = ${item.ticketTypeId}
                AND "quantity" - "quantitySold" - "quantityReserved" >= ${item.quantity}
            `;
            if (claimed === 0) {
              throw new FulfillmentError(
                `Not enough tickets for ${ticketType.name}`
              );
            }
          }

          const attendees = Array.isArray(item.attendees)
            ? (item.attendees as unknown[])
            : [];
          for (let i = 0; i < item.quantity; i++) {
            let code = generateTicketCode();
            for (let attempt = 0; attempt < 5; attempt++) {
              const exists = await tx.ticket.findUnique({ where: { code } });
              if (!exists) break;
              code = generateTicketCode();
            }
            const { holderName, holderEmail } = holderFrom(
              attendees[i],
              order
            );
            await tx.ticket.create({
              data: {
                ticketTypeId: item.ticketTypeId,
                userId: order.userId,
                orderId: order.id,
                code,
                source: "PAID",
                holderName,
                holderEmail,
              },
            });
          }
          break;
        }
        case OrderItemType.PRODUCT: {
          if (!item.productVariantId) break;
          const variant = await tx.productVariant.findUnique({
            where: { id: item.productVariantId },
          });
          if (!variant) {
            throw new FulfillmentError(
              `Variant ${item.productVariantId} not found`
            );
          }
          // Atomic decrement under the row lock, then enforce non-negative
          // stock on the post-decrement value (same race rationale as tickets).
          const updatedVariant = await tx.productVariant.update({
            where: { id: item.productVariantId },
            data: { stock: { decrement: item.quantity } },
          });
          if (updatedVariant.stock < 0) {
            throw new FulfillmentError(
              `Insufficient stock for variant ${item.productVariantId}`
            );
          }
          break;
        }
        case OrderItemType.RELEASE: {
          if (!item.releaseId) break;
          if (!order.userId) {
            throw new FulfillmentError(
              "A paid music purchase requires a signed-in buyer"
            );
          }
          const existing = await tx.releaseUnlock.findUnique({
            where: {
              userId_releaseId: {
                userId: order.userId,
                releaseId: item.releaseId,
              },
            },
          });
          if (!existing) {
            await tx.releaseUnlock.create({
              data: {
                userId: order.userId,
                releaseId: item.releaseId,
                orderItemId: item.id,
                source: "ORDER",
              },
            });
          }
          break;
        }
        case OrderItemType.MEMBERSHIP_PASS: {
          if (!item.membershipPlanId) break;
          if (!order.userId) {
            throw new FulfillmentError(
              "A membership purchase requires a signed-in buyer"
            );
          }
          await grantOrExtendMembership(
            {
              userId: order.userId,
              membershipPlanId: item.membershipPlanId,
              orderId: order.id,
            },
            tx
          );
          break;
        }
        default:
          break;
      }
    }

    await tx.order.update({
      where: { id: orderId },
      data: { status: "PAID", paymentStatus: finalPaymentStatus },
    });
  });
}
