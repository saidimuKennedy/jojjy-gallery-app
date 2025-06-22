import { NextApiRequest, NextApiResponse } from "next";
import { mockArtworks } from "../../lib/mockData";
import { Artwork } from "../../types";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, query } = req;

  switch (method) {
    case "GET":
      const { category, priceRange, search } = query;
      let filteredArtworks: Artwork[] = [...mockArtworks];

      // Filter by category
      if (category && category !== "all") {
        filteredArtworks = filteredArtworks.filter(
          (art) =>
            art.category.toLowerCase() === (category as string).toLowerCase()
        );
      }

      // Filter by price range
      if (priceRange) {
        const [min, max] = (priceRange as string).split("-").map(Number);
        filteredArtworks = filteredArtworks.filter(
          (art) => art.price >= min && art.price <= max
        );
      }

      // Filter by search query
      if (search) {
        const searchLower = (search as string).toLowerCase();
        filteredArtworks = filteredArtworks.filter(
          (art) =>
            art.title.toLowerCase().includes(searchLower) ||
            art.artist.toLowerCase().includes(searchLower) ||
            art.category.toLowerCase().includes(searchLower)
        );
      }

      res.status(200).json({
        success: true,
        data: filteredArtworks,
        total: filteredArtworks.length,
      });
      break;

    default:
      res.setHeader("Allow", ["GET"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
