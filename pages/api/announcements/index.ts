import type { NextApiRequest, NextApiResponse } from "next";
import { setPublicCacheHeaders } from "@/lib/api-cache";
import { getPublishedAnnouncements } from "@/lib/data/announcements";

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

  try {
    const data = await getPublishedAnnouncements();
    setPublicCacheHeaders(res, { sMaxAge: 300, swr: 900 });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Error listing announcements:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
