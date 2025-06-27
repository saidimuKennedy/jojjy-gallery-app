/*
  Warnings:

  - You are about to drop the column `featured` on the `artworks` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "artworks" DROP COLUMN "featured",
ADD COLUMN     "inGallery" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "seriesId" INTEGER;

-- CreateTable
CREATE TABLE "series" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "series_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "series_name_key" ON "series"("name");

-- CreateIndex
CREATE UNIQUE INDEX "series_slug_key" ON "series"("slug");

-- AddForeignKey
ALTER TABLE "artworks" ADD CONSTRAINT "artworks_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "series"("id") ON DELETE SET NULL ON UPDATE CASCADE;
