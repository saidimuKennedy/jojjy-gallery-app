import type { NextApiRequest, NextApiResponse } from "next";
import { buffer } from "node:stream/consumers";
import prisma from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/paystack";
import { completeOrderFromPaystackReference } from "@/lib/orders/complete-payment";
import { releaseOrderReservations } from "@/lib/ticketing/inventory";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res
      .status(405)
      .json({ success: false, message: `Method ${req.method} Not Allowed` });
  }

  try {
    const rawBody = (await buffer(req)).toString("utf8");
    const signature = req.headers["x-paystack-signature"] as
      | string
      | undefined;

    if (!verifyWebhookSignature(rawBody, signature)) {
      return res.status(401).json({ success: false, message: "Invalid signature" });
    }

    const event = JSON.parse(rawBody) as {
      event?: string;
      data?: { reference?: string; status?: string };
    };

    if (event.event === "charge.success" && event.data?.reference) {
      // Unknown references (no matching order) are acknowledged without
      // retry: re-delivery could never succeed. Genuine fulfillment failures
      // below still return 500 so Paystack retries.
      const existing = await prisma.order.findUnique({
        where: { paystackRef: event.data.reference },
        select: { id: true },
      });
      if (!existing) {
        console.error(
          "Paystack webhook for unknown reference:",
          event.data.reference
        );
        return res.status(200).json({ success: true });
      }
      try {
        await completeOrderFromPaystackReference(event.data.reference);
      } catch (err) {
        console.error("Paystack webhook fulfillment error:", err);
        return res.status(500).json({
          success: false,
          message: err instanceof Error ? err.message : "Fulfillment failed",
        });
      }
    }

    if (event.event === "charge.failed" && event.data?.reference) {
      const pending = await prisma.order.findUnique({
        where: { paystackRef: event.data.reference },
        select: { id: true, status: true },
      });
      if (pending && pending.status === "PENDING") {
        // Mark failed and return any held ticket stock to the pool, atomically.
        await prisma.$transaction(async (tx) => {
          await tx.order.update({
            where: { id: pending.id },
            data: { status: "FAILED", paymentStatus: "FAILED" },
          });
          await releaseOrderReservations(tx, pending.id);
        });
      }
    }

    // Refund status events are reconciled by the CRM (which owns the Refund
    // model) via Paystack status polling; acknowledge them here so Paystack
    // does not retry. Never claim refund success from a browser/webhook alone.
    if (
      typeof event.event === "string" &&
      event.event.startsWith("refund.") 
    ) {
      return res.status(200).json({ success: true });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Paystack webhook error:", error);
    return res.status(500).json({ success: false, message: "Webhook error" });
  }
}
