import prisma from "@/lib/prisma";
import { verifyTransaction } from "@/lib/paystack";
import { fulfillOrder, FulfillmentError } from "@/lib/orders/fulfill";
import { releaseOrderReservations } from "@/lib/ticketing/inventory";
import { sendOrderConfirmationEmail } from "@/lib/email/order-confirmation";

export async function completeOrderFromPaystackReference(
  reference: string
): Promise<{ orderId: string; status: string }> {
  const order = await prisma.order.findUnique({
    where: { paystackRef: reference },
  });

  if (!order) {
    throw new Error(`No order found for reference ${reference}`);
  }

  // Idempotent: a repeated webhook/verify for an already-paid order is a no-op.
  if (order.status === "PAID") {
    return { orderId: order.id, status: order.status };
  }

  const verification = await verifyTransaction(reference);
  if (verification.status !== "success") {
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: { status: "FAILED", paymentStatus: "FAILED" },
      });
      await releaseOrderReservations(tx, order.id);
    });
    throw new Error(`Payment not successful (${verification.status})`);
  }

  const chargedAmount = order.paystackChargeAmount
    ? order.paystackChargeAmount.toNumber()
    : order.amount.toNumber();
  const expectedAmount = Math.round(chargedAmount * 100);
  if (verification.amount !== expectedAmount) {
    // Do not release stock or mark paid: a mismatch needs a human.
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: "NEEDS_ATTENTION" },
    });
    throw new Error("Payment amount mismatch");
  }

  const expectedCurrency = (
    order.paystackChargeCurrency ?? order.currency
  ).toUpperCase();
  if (verification.currency.toUpperCase() !== expectedCurrency) {
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: "NEEDS_ATTENTION" },
    });
    throw new Error("Payment currency mismatch");
  }

  try {
    await fulfillOrder(order.id, { paymentStatus: "SUCCESS" });
  } catch (err) {
    if (err instanceof FulfillmentError) {
      // Payment succeeded but issuance failed (e.g. oversold by race).
      // Leave PENDING + NEEDS_ATTENTION so it is inspectable and retryable.
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: "NEEDS_ATTENTION" },
      });
    }
    throw err;
  }

  try {
    await sendOrderConfirmationEmail(order.id);
  } catch (emailErr) {
    // Delivery failure must not roll back a paid issuance.
    console.error("Order confirmation email failed:", emailErr);
  }

  return { orderId: order.id, status: "PAID" };
}
