import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises";
import { UserRole } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { APIError } from "@/types/api";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const config = {
  api: {
    bodyParser: false,
  },
};

interface ImageUploadSuccessResponse {
  success: boolean;
  message: string;
  imageUrl: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ImageUploadSuccessResponse | APIError>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res
      .status(405)
      .json({ success: false, message: `Method ${req.method} Not Allowed` });
  }

  // --- RBAC Check using NextAuth.js ---
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user || !session.user.role) {
    return res.status(401).json({
      success: false,
      message: "Authentication required or session data incomplete.",
    });
  }

  if (session.user.role !== UserRole.ADMIN) {
    return res.status(403).json({
      success: false,
      message: "Forbidden: You do not have permission to upload images.",
    });
  }
  // --- End RBAC Check ---

  console.log(
    `Admin user ${session.user.id} (${session.user.email}) is attempting to upload an image.`
  );

  const form = formidable({});

  try {
    const [fields, files] = await form.parse(req);

    if (!files.file || files.file.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded." });
    }

    const uploadedFile = files.file[0];

    const uploadOptions = {
      folder: "artwork_uploads",
    };

    const cloudinaryResponse = await cloudinary.uploader.upload(
      uploadedFile.filepath,
      uploadOptions
    );

    await fs.unlink(uploadedFile.filepath);

    return res.status(200).json({
      success: true,
      message: "Image uploaded to Cloudinary successfully!",
      imageUrl: cloudinaryResponse.secure_url,
    });
  } catch (error) {
    console.error("Error uploading image to Cloudinary:", error);
    return res.status(500).json({
      success: false,
      message:
        (error as Error).message || "Failed to upload image to Cloudinary.",
    });
  }
}
