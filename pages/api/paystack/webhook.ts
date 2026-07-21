import type { NextApiRequest, NextApiResponse } from "next";
import { buffer } from "node:stream/consumers";
import prisma from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/paystack";
import { completeOrderFromPaystackReference } from "@/lib/orders/complete-payment";

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
      await prisma.order.updateMany({
        where: {
          paystackRef: event.data.reference,
          status: "PENDING",
        },
        data: { status: "FAILED" },
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Paystack webhook error:", error);
    return res.status(500).json({ success: false, message: "Webhook error" });
  }
}
