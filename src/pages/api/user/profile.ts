import { NextApiResponse } from "next";
import { withAuth, AuthenticatedNextApiRequest } from "../../../lib/session";

async function handler(req: AuthenticatedNextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const user = req.user;

  const { passwordHash: _, ...userWithoutPassword } = user!;

  res.status(200).json({ user: userWithoutPassword });
}

export default withAuth(handler);
