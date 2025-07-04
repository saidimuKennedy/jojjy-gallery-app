import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { UserRole } from "@prisma/client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || session.user?.role !== UserRole.ADMIN) {
    return res.status(403).json({ message: "Forbidden: Not authorized" });
  }

  switch (req.method) {
    case "GET":
      try {
        const series = await prisma.series.findMany({
          orderBy: {
            createdAt: "desc",
          },
        });
        return res.status(200).json(series);
      } catch (error) {
        console.error("Error fetching series:", error);
        return res.status(500).json({ message: "Failed to fetch series" });
      }

    case "POST":
      try {
        const { name, description, isPublished } = req.body;

        // Basic validation
        if (!name) {
          return res.status(400).json({ message: "Series name is required." });
        }

        const slug = name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-*|-*$/g, "");

        const newSeries = await prisma.series.create({
          data: {
            name,
            slug,
            description: description || null,
          },
        });
        return res.status(201).json(newSeries);
      } catch (error) {
        console.error("Error creating series:", error);
        return res.status(500).json({ message: "Failed to create series" });
      }

    case "PUT":
      try {
        const { id, name, description, isPublished } = req.body;

        // Basic validation
        if (!id || typeof id !== "number") {
          return res
            .status(400)
            .json({ message: "Series ID is required and must be a number." });
        }
        if (!name) {
          return res.status(400).json({ message: "Series name is required." });
        }

        const updatedSeries = await prisma.series.update({
          where: { id },
          data: {
            name,

            description: description || null,
          },
        });
        return res.status(200).json(updatedSeries);
      } catch (error) {
        if (error instanceof Error) {
          console.error("Error updating series:", error);
          if ((error as any).code === "P2025") {
            return res.status(404).json({ message: "Series not found." });
          } else {
            console.error("Caught unknown error:", error);
          }
        }
        return res.status(500).json({ message: "Failed to update series" });
      }

    case "DELETE":
      try {
        const { id } = req.query;

        if (!id || isNaN(Number(id))) {
          return res
            .status(400)
            .json({ message: "Series ID is required and must be a number." });
        }

        const artworksInSeries = await prisma.artwork.count({
          where: { seriesId: Number(id) },
        });

        if (artworksInSeries > 0) {
          return res.status(409).json({
            message:
              "Cannot delete series: It still contains artworks. Please reassign or delete artworks first.",
          });
        }

        await prisma.series.delete({
          where: { id: Number(id) },
        });
        return res.status(204).end();
      } catch (error) {
        if (error instanceof Error) {
          console.error("Error deleting series:", error);
          if ((error as any).code === "P2025") {
            return res.status(404).json({ message: "Series not found." });
          }
        }

        return res.status(500).json({ message: "Failed to delete series" });
      }

    default:
      res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
