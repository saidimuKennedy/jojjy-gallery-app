import { NextApiRequest, NextApiResponse } from "next";
import prisma from "./prisma";
import { parse } from "cookie";
import { User } from "@prisma/client";

export interface AuthenticatedNextApiRequest extends NextApiRequest {
  user?: User;
}

export async function authenticate(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse
): Promise<User | null> {
  const cookies = parse(req.headers.cookie || "");
  const sessionId = cookies.session_id;

  if (!sessionId) {
    return null;
  }

  try {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await prisma.session.delete({ where: { id: sessionId } });
      }
      return null;
    }

    req.user = session.user;
    return session.user;
  } catch (error) {
    console.error("Session authentication error:", error);
    return null;
  }
}

export function withAuth(
  handler: (
    req: AuthenticatedNextApiRequest,
    res: NextApiResponse
  ) => Promise<void>
) {
  return async (req: AuthenticatedNextApiRequest, res: NextApiResponse) => {
    const user = await authenticate(req, res);

    if (!user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    return handler(req, res);
  };
}
