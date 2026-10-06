import { OrderItemType } from "@prisma/client";
import prisma from "@/lib/prisma";
import { generateTicketCode } from "@/lib/orders/ticket-code";
import { grantOrExtendMembership } from "@/lib/music/membership";

export class FulfillmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FulfillmentError";
  }
}

export async function fulfillOrder(orderId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
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
                {
                  status: "RESERVED",
                  reservedByUserId: order.userId,
                },
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
          // Atomic increment under the row lock, then enforce capacity on the
          // post-increment value: concurrent fulfills serialize here, so the
          // loser observes the winner's increment and fails instead of
          // overselling. Throwing rolls the whole transaction back.
          const updatedType = await tx.ticketType.update({
            where: { id: item.ticketTypeId },
            data: { quantitySold: { increment: item.quantity } },
          });
          if (updatedType.quantity - updatedType.quantitySold < 0) {
            throw new FulfillmentError(
              `Not enough tickets for ${ticketType.name}`
            );
          }
          for (let i = 0; i < item.quantity; i++) {
            let code = generateTicketCode();
            for (let attempt = 0; attempt < 5; attempt++) {
              const exists = await tx.ticket.findUnique({ where: { code } });
              if (!exists) break;
              code = generateTicketCode();
            }
            await tx.ticket.create({
              data: {
                ticketTypeId: item.ticketTypeId,
                userId: order.userId,
                orderId: order.id,
                code,
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
      data: { status: "PAID" },
    });
  });
}
