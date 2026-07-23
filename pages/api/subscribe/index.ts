import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import {
  isValidSubscriberEmail,
  normalizeSubscriberEmail,
} from "@/lib/audience";

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

  const raw =
    typeof req.body?.email === "string" ? req.body.email : "";
  const email = normalizeSubscriberEmail(raw);

  if (!email || !isValidSubscriberEmail(email)) {
    return res.status(400).json({
      success: false,
      message: "Please enter a valid email address",
    });
  }

  try {
    const existing = await prisma.subscriber.findUnique({
      where: { email },
    });

    if (existing) {
      if (existing.status === "UNSUBSCRIBED") {
        await prisma.subscriber.update({
          where: { id: existing.id },
          data: {
            status: "ACTIVE",
            subscribedAt: new Date(),
            unsubscribedAt: null,
          },
        });
      }
      return res.status(200).json({
        success: true,
        data: { subscribed: true },
        message: "Thanks for joining",
      });
    }

    await prisma.subscriber.create({
      data: {
        email,
        status: "ACTIVE",
        subscribedAt: new Date(),
      },
    });

    return res.status(201).json({
      success: true,
      data: { subscribed: true },
      message: "Thanks for joining",
    });
  } catch (error) {
    console.error("Error subscribing:", error);
    return res.status(500).json({
      success: false,
      message: "Could not subscribe. Please try again.",
    });
  }
}
