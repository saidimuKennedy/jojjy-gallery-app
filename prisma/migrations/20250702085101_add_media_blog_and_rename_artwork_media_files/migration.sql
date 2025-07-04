/*
  Warnings:

  - You are about to drop the `media_files` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "MediaFileType" AS ENUM ('IMAGE', 'VIDEO', 'AUDIO');

-- CreateEnum
CREATE TYPE "MediaBlogEntryType" AS ENUM ('VIDEO', 'IMAGES', 'AUDIO', 'EXTERNAL_LINK');

-- DropForeignKey
ALTER TABLE "media_files" DROP CONSTRAINT "media_files_artworkId_fkey";

-- DropTable
DROP TABLE "media_files";

-- CreateTable
CREATE TABLE "artwork_media_files" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "type" "MediaFileType" NOT NULL,
    "description" TEXT,
    "thumbnailUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "artworkId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "artwork_media_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_blog_entries" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "shortDesc" TEXT,
    "type" "MediaBlogEntryType" NOT NULL,
    "externalLink" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_blog_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_blog_files" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "type" "MediaFileType" NOT NULL,
    "description" TEXT,
    "thumbnailUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "mediaBlogEntryId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_blog_files_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "artwork_media_files" ADD CONSTRAINT "artwork_media_files_artworkId_fkey" FOREIGN KEY ("artworkId") REFERENCES "artworks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_blog_files" ADD CONSTRAINT "media_blog_files_mediaBlogEntryId_fkey" FOREIGN KEY ("mediaBlogEntryId") REFERENCES "media_blog_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
