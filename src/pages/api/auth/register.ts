import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma"; 
import { hashPassword } from "../../../lib/auth"; 

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
      .json({ message: "Missing required fields (username, email, password)" });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters long" });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "User with this email already exists" });
    }

    const existingUsername = await prisma.user.findUnique({
      where: { username: username },
    });
    if (existingUsername) {
      return res.status(409).json({ message: "Username already taken" });
    }

    const passwordHash = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
      },
    });

    const { passwordHash: _, ...userWithoutPassword } = newUser;
    res
      .status(201)
      .json({
        message: "User registered successfully",
        user: userWithoutPassword,
      });
  } catch (error) {
    console.error("Registration error:", error); // TODO: error handling

    res
      .status(500)
      .json({
        message: "An error occurred during registration. Please try again.",
      });
  }
}
