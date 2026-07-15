import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

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

  const { slug } = req.query;
  if (!slug || typeof slug !== "string") {
    return res
      .status(400)
      .json({ success: false, message: "Invalid product slug" });
  }

  try {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        variants: { orderBy: { price: "asc" } },
      },
    });

    if (!product || !product.isAvailable) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const data = {
      ...product,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
      variants: product.variants.map((v) => ({
        ...v,
        price: v.price.toNumber(),
        createdAt: v.createdAt.toISOString(),
        updatedAt: v.updatedAt.toISOString(),
      })),
    };

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Error fetching product:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
