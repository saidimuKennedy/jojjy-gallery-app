import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma"; 
import { verifyPassword } from "../../../lib/auth"; 
import { serialize } from "cookie"; 
import { v4 as uuidv4 } from "uuid"; 

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Missing email or password" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: email },
    });

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // --- Session Management: Create a new session record ---
    const sessionId = uuidv4(); // Generate a unique session ID
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);
    await prisma.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        expiresAt: expiresAt,
      },
    });

    res.setHeader(
      "Set-Cookie",
      serialize("session_id", sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        expires: expiresAt,
      })
    );

    const { passwordHash: _, ...userWithoutPassword } = user;
    res
      .status(200)
      .json({ message: "Login successful", user: userWithoutPassword });
  } catch (error) {
    console.error("Login error:", error);
    res
      .status(500)
      .json({ message: "An error occurred during login. Please try again." });
  }
}
