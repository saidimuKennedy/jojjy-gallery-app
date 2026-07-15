import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { convertPrismaTransactionToAPI } from "@/types/api";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
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

  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { timestamp: "desc" },
    });

    return res.status(200).json({
      success: true,
      data: transactions.map(convertPrismaTransactionToAPI),
    });
  } catch (error) {
    console.error("Error listing purchases:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
