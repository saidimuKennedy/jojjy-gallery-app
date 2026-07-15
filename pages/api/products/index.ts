import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

function serializeProduct(product: {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  category: string | null;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
  variants: {
    id: number;
    productId: number;
    sku: string;
    size: string | null;
    color: string | null;
    price: { toNumber(): number };
    stock: number;
    createdAt: Date;
    updatedAt: Date;
  }[];
}) {
  return {
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
}

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
    const products = await prisma.product.findMany({
      where: { isAvailable: true },
      orderBy: { createdAt: "desc" },
      include: {
        variants: {
          where: { stock: { gt: 0 } },
          orderBy: { price: "asc" },
        },
      },
    });

    return res.status(200).json({
      success: true,
      data: products.map(serializeProduct),
    });
  } catch (error) {
    console.error("Error listing products:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
