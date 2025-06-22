import { NextApiResponse } from "next";
import {
  PaymentResponse,
  PaymentSuccessData,
  PaymentErrorData,
  CartPaymentRequestData,
} from "../../../types/api";
import { AuthenticatedNextApiRequest, withAuth } from "../../../lib/session";
import prisma from "../../../lib/prisma";
import { Artwork as PrismaArtwork, Transaction as PrismaTransaction, Prisma } from "@prisma/client"; // Import Prisma for Decimal

async function handler(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse<PaymentResponse>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res
      .status(405)
      .json({ success: false, message: `Method ${req.method} Not Allowed` });
  }

  const userId = req.user?.id;
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
    artworkIds.some((id) => typeof id !== "number") // Corrected from .every to .some
  ) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid input data: phoneNumber or artworkIds are invalid" });
  }

  try {
    const artworksToPurchase: PrismaArtwork[] = await prisma.artwork.findMany({
      where: { id: { in: artworkIds }, isAvailable: true },
    });

    if (artworksToPurchase.length !== artworkIds.length) { // Check if all requested were found and available
      const missingOrUnavailableIds = artworkIds.filter(
        (id) => !artworksToPurchase.some((artwork) => artwork.id === id)
      );
      return res.status(404).json({
        success: false,
        message: `Some artworks not found or are unavailable: IDs ${missingOrUnavailableIds.join(
          ", "
        )}`,
      });
    }

    // Server-side payment calculation of the total amount
    const calculatedAmount = artworksToPurchase.reduce(
      (total, artwork) => total + artwork.price.toNumber(), // artwork.price is Prisma.Decimal here
      0
    );

    // Simulate the payment process
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const isSuccess = Math.random() > 0.1;

    if (isSuccess) {
      const transactionId = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;

      try {
        await prisma.$transaction(async (tx) => {
          // Create the transaction record
          const newTransaction = await tx.transaction.create({
            data: {
              id: transactionId,
              artworkIds: JSON.stringify(artworkIds), // Store as JSON string as per schema
              userId: userId,
              status: "completed",
              amount: new Prisma.Decimal(calculatedAmount), // <--- CHANGE: Use Prisma.Decimal
              phoneNumber: phoneNumber,
            },
          });

          await tx.artwork.updateMany({
            where: { id: { in: artworkIds } },
            data: {
              isAvailable: false,
            },
          });

          const successData: PaymentSuccessData = {
            transactionId: newTransaction.id,
            amount: newTransaction.amount.toNumber(),
            phoneNumber: newTransaction.phoneNumber,
            artworkIds: artworkIds,
            status: newTransaction.status as "completed",
            timestamp: newTransaction.timestamp.toISOString(),
          };

          // IMPORTANT: Ensure a response is sent from within the transaction callback
          res.status(200).json({
            success: true,
            message: "Payment successful!",
            data: successData,
          });
        });
      } catch (dbError) {
        console.error("Database error during payment success:", dbError);
        // Ensure the response is sent for database errors within the transaction
        return res.status(500).json({
          success: false,
          message:
            "Payment recorded successfully, but failed to save transaction data.",
        });
      }
    } else {
      const errorData: PaymentErrorData = {
        success: false,
        message: "Payment failed. Please try again.",
        error: "INSUFFICIENT_FUNDS",
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

export default withAuth(handler);
