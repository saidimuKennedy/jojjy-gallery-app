import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { convertPrismaArtworkWithRelationsToAPI } from "@/types/api";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  try {
    const {
      page = "1",
      limit,
      category,
      artist,
      medium,
      year,
      minPrice,
      maxPrice,
      search,
      seriesId,
      isAvailable,
      sort,
    } = req.query;

    let pageNum: number;
    let limitNum: number | undefined;

    let prismaFindManyArgs: {
      skip?: number;
      take?: number;
      where?: any;
      orderBy?: any;
      include?: any;
    } = {};

    const limitQuery = limit as string | undefined;
    if (limitQuery === "all") {
      pageNum = 1;
      limitNum = undefined;
    } else {
      let parsedLimit = parseInt(limitQuery || "10");
      if (isNaN(parsedLimit) || parsedLimit <= 0) {
        parsedLimit = 10;
      }
      limitNum = parsedLimit;

      pageNum = parseInt(page as string);
      if (isNaN(pageNum) || pageNum <= 0) {
        pageNum = 1;
      }
      prismaFindManyArgs.skip = (pageNum - 1) * limitNum;
      prismaFindManyArgs.take = limitNum;
    }

    const where: any = {};

    if (category) {
      where.category = String(category);
    }
    if (artist) {
      where.artist = { contains: String(artist), mode: "insensitive" };
    }
    if (medium) {
      where.medium = { contains: String(medium), mode: "insensitive" };
    }
    if (year) {
      where.year = parseInt(year as string);
    }
    if (isAvailable !== undefined) {
      where.isAvailable = String(isAvailable).toLowerCase() === "true";
    }

    if (seriesId) {
      where.seriesId = parseInt(seriesId as string);
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) {
        where.price.gte = parseFloat(minPrice as string);
      }
      if (maxPrice) {
        where.price.lte = parseFloat(maxPrice as string);
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: String(search), mode: "insensitive" } },
        { description: { contains: String(search), mode: "insensitive" } },
        { artist: { contains: String(search), mode: "insensitive" } },
        { category: { contains: String(search), mode: "insensitive" } },
        { medium: { contains: String(search), mode: "insensitive" } },
      ];
    }

    let orderBy: any = { createdAt: "desc" };
    if (sort) {
      switch (sort) {
        case "price_asc":
          orderBy = { price: "asc" };
          break;
        case "price_desc":
          orderBy = { price: "desc" };
          break;
        case "name_asc":
          orderBy = { title: "asc" };
          break;
        case "name_desc":
          orderBy = { title: "desc" };
          break;
        case "year_asc":
          orderBy = { year: "asc" };
          break;
        case "year_desc":
          orderBy = { year: "desc" };
          break;
        case "views_asc":
          orderBy = { views: "asc" };
          break;
        case "views_desc":
          orderBy = { views: "desc" };
          break;
      }
    }

    const prismaQuery = {
      where,
      orderBy,
      include: { series: true, mediaFiles: true },
      ...prismaFindManyArgs,
    };

    const [artworks, total] = await prisma.$transaction([
      prisma.artwork.findMany(prismaQuery),
      prisma.artwork.count({ where }),
    ]);

    const apiArtworks = artworks.map(convertPrismaArtworkWithRelationsToAPI);

    return res.status(200).json({
      success: true,
      data: apiArtworks,
      total: total,
      page: pageNum,
      limit: limitNum,
    });
  } catch (error) {
    console.error("Error fetching artworks:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}