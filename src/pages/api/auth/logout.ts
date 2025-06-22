// pages/api/auth/logout.ts
import { NextApiResponse } from "next";
import { serialize, parse } from "cookie"; // Import both serialize (for setting) and parse (for reading) cookies
import prisma from "../../../lib/prisma";
import { withAuth, AuthenticatedNextApiRequest } from "../../../lib/session"; // Use withAuth to ensure a valid session is attempting to log out

async function handler(req: AuthenticatedNextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const cookies = parse(req.headers.cookie || "");
  const sessionId = cookies.session_id;

  if (sessionId) {
    try {
      await prisma.session.delete({
        where: { id: sessionId },
      });
    } catch (error) {
      console.error("Error deleting session from DB during logout:", error);
    }
  }

  res.setHeader(
    "Set-Cookie",
    serialize("session_id", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(0),
    })
  );

  res.status(200).json({ message: "Logged out successfully" });
}

export default withAuth(handler);
