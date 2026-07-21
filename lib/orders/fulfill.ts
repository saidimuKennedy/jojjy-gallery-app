import { OrderItemType } from "@prisma/client";
import prisma from "@/lib/prisma";
import { generateTicketCode } from "@/lib/orders/ticket-code";

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
          const artwork = await tx.artwork.findUnique({
            where: { id: item.artworkId },
          });
          if (!artwork || !artwork.isAvailable) {
            throw new FulfillmentError(
              `Artwork ${item.artworkId} is no longer available`
            );
          }
          if (
            artwork.status !== "AVAILABLE" &&
            !(
              artwork.status === "RESERVED" &&
              artwork.reservedByUserId === order.userId
            )
          ) {
            throw new FulfillmentError(
              `Artwork ${item.artworkId} is not available for purchase`
            );
          }
          await tx.artwork.update({
            where: { id: item.artworkId },
            data: {
              status: "SOLD",
              isAvailable: false,
              reservedByUserId: null,
              reservedUntil: null,
            },
          });
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
          const remaining = ticketType.quantity - ticketType.quantitySold;
          if (remaining < item.quantity) {
            throw new FulfillmentError(
              `Not enough tickets for ${ticketType.name}`
            );
          }
          await tx.ticketType.update({
            where: { id: item.ticketTypeId },
            data: { quantitySold: { increment: item.quantity } },
          });
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
          if (!variant || variant.stock < item.quantity) {
            throw new FulfillmentError(
              `Insufficient stock for variant ${item.productVariantId}`
            );
          }
          await tx.productVariant.update({
            where: { id: item.productVariantId },
            data: { stock: { decrement: item.quantity } },
          });
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
