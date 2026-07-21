import prisma from "@/lib/prisma";
import { verifyTransaction } from "@/lib/paystack";
import { fulfillOrder, FulfillmentError } from "@/lib/orders/fulfill";
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

  if (order.status === "PAID") {
    return { orderId: order.id, status: order.status };
  }

  const verification = await verifyTransaction(reference);
  if (verification.status !== "success") {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "FAILED" },
    });
    throw new Error(`Payment not successful (${verification.status})`);
  }

  const expectedAmount = Math.round(order.amount.toNumber() * 100);
  if (verification.amount !== expectedAmount) {
    throw new Error("Payment amount mismatch");
  }

  try {
    await fulfillOrder(order.id);
  } catch (err) {
    if (err instanceof FulfillmentError) {
      throw err;
    }
    throw err;
  }

  try {
    await sendOrderConfirmationEmail(order.id);
  } catch (emailErr) {
    console.error("Order confirmation email failed:", emailErr);
  }

  return { orderId: order.id, status: "PAID" };
}
