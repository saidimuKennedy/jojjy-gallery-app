import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { UserRole } from "@prisma/client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Missing required fields (username, email, password)" });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ success: false, message: "Password must be at least 6 characters long" });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: "Invalid email format" });
  }

  try {
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email: email },
    });
    if (existingUserByEmail) {
      return res
        .status(409)
        .json({ success: false, message: "User with this email already exists." });
    }

    const existingUserByUsername = await prisma.user.findUnique({
      where: { username: username },
    });
    if (existingUserByUsername) {
      return res
        .status(409)
        .json({ success: false, message: "Username already taken." });
    }

    const passwordHash = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        role: UserRole.USER,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    res
      .status(201)
      .json({
        success: true,
        message: "Registration successful! You can now log in.",
        user: newUser,
      });
  } catch (error) {
    console.error("Registration error:", error);
    res
      .status(500)
      .json({ success: false, message: "An error occurred during registration. Please try again." });
  }
}