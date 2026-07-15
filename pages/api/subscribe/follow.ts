import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST" && req.method !== "DELETE" && req.method !== "GET") {
    res.setHeader("Allow", ["GET", "POST", "DELETE"]);
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
    if (req.method === "GET") {
      const subscriber = await prisma.subscriber.findUnique({
        where: { userId },
      });
      return res.status(200).json({
        success: true,
        data: { following: !!subscriber },
      });
    }

    if (req.method === "POST") {
      const email =
        typeof req.body?.email === "string"
          ? req.body.email
          : session.user?.email || null;

      const existingByUser = await prisma.subscriber.findUnique({
        where: { userId },
      });
      if (existingByUser) {
        return res.status(200).json({
          success: true,
          data: { following: true },
          message: "Already following",
        });
      }

      // Link an existing email subscriber if present, else create
      if (email) {
        const byEmail = await prisma.subscriber.findUnique({
          where: { email },
        });
        if (byEmail) {
          if (byEmail.userId && byEmail.userId !== userId) {
            return res.status(409).json({
              success: false,
              message: "This email is already linked to another account",
            });
          }
          await prisma.subscriber.update({
            where: { id: byEmail.id },
            data: { userId },
          });
          return res.status(200).json({
            success: true,
            data: { following: true },
          });
        }
      }

      await prisma.subscriber.create({
        data: {
          userId,
          email: email || null,
        },
      });

      return res.status(200).json({
        success: true,
        data: { following: true },
      });
    }

    // DELETE — unfollow
    const existing = await prisma.subscriber.findUnique({
      where: { userId },
    });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Not currently following",
      });
    }

    // Keep the subscriber row if it has email/phone for announcements;
    // only unlink the user when there's contact info, otherwise delete.
    if (existing.email || existing.phoneNumber) {
      await prisma.subscriber.update({
        where: { id: existing.id },
        data: { userId: null },
      });
    } else {
      await prisma.subscriber.delete({ where: { id: existing.id } });
    }

    return res.status(200).json({
      success: true,
      data: { following: false },
    });
  } catch (error) {
    console.error("Error handling follow:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
