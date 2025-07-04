import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import prisma from "../../../lib/prisma";
import {
  PaymentResponse,
  PaymentSuccessData,
  PaymentErrorData,
  CartPaymentRequestData,
} from "../../../types/api";
import { Artwork as PrismaArtwork, Prisma } from "@prisma/client";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PaymentResponse>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res
      .status(405)
      .json({ success: false, message: `Method ${req.method} Not Allowed` });
  }

  const session = await getServerSession(req, res, authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return res
      .status(401)
      .json({ success: false, message: "Authentication required" });
  }

  const { phoneNumber, artworkIds } = req.body as CartPaymentRequestData;

  if (
    typeof phoneNumber !== "string" ||
    !Array.isArray(artworkIds) ||
    artworkIds.length === 0 ||
    artworkIds.some((id) => typeof id !== "number")
  ) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid input data: phoneNumber or artworkIds are invalid" });
  }

  try {
    const artworksToPurchase: PrismaArtwork[] = await prisma.artwork.findMany({
      where: { id: { in: artworkIds }, isAvailable: true },
    });

    if (artworksToPurchase.length !== artworkIds.length) {
      const missingOrUnavailableIds = artworkIds.filter(
        (id) => !artworksToPurchase.some((artwork) => artwork.id === id)
      );
      return res.status(404).json({
        success: false,
        message: `Some artworks not found or are unavailable: IDs ${missingOrUnavailableIds.join(", ")}`,
      });
    }

    const calculatedAmount = artworksToPurchase.reduce(
      (total, artwork) => total + artwork.price.toNumber(),
      0
    );

    // Call the real M-Pesa STK Push endpoint
    const stkRes = await fetch(`${process.env.NEXTAUTH_URL}/api/mpesa/stkpush`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: phoneNumber,
        amount: calculatedAmount,
      }),
    });

    const stkData = await stkRes.json();

    if (stkRes.ok && stkData.CheckoutRequestID) {
      // Save transaction as pending
      const transaction = await prisma.transaction.create({
        data: {
          id: stkData.CheckoutRequestID,
          artworkIds: JSON.stringify(artworkIds),
          userId: userId,
          status: "pending",
          amount: new Prisma.Decimal(calculatedAmount),
          phoneNumber: phoneNumber,
        },
      });

      const successData: PaymentSuccessData = {
        transactionId: transaction.id,
        amount: transaction.amount.toNumber(),
        phoneNumber: transaction.phoneNumber,
        artworkIds: artworkIds,
        status: transaction.status as "pending",
        timestamp: transaction.timestamp.toISOString(),
        stkResponse: stkData,
      };

      return res.status(200).json({
        success: true,
        message: "STK Push initiated. Awaiting payment confirmation.",
        data: successData,
      });
    } else {
      const errorData: PaymentErrorData = {
        success: false,
        message: stkData.errorMessage || "Failed to initiate STK Push.",
        error: stkData,
      };
      return res.status(400).json(errorData);
    }
  } catch (error) {
    console.error("Payment processing error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during payment processing.",
    });
  }
}
