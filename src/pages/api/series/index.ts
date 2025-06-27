import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { convertPrismaSeriesToAPI } from "@/types/api";

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
    const seriesList = await prisma.series.findMany({
      orderBy: { name: "asc" },
    });

    const apiSeriesList = seriesList.map(convertPrismaSeriesToAPI);

    return res.status(200).json({
      success: true,
      data: apiSeriesList,
      total: apiSeriesList.length,
    });
  } catch (error) {
    console.error("Error fetching series list:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
