-- CreateEnum
CREATE TYPE "RsvpStatus" AS ENUM ('GOING', 'INTERESTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DeliveryMethod" AS ENUM ('LOCAL_PICKUP', 'NAIROBI_DELIVERY', 'KENYA_SHIPPING', 'INTERNATIONAL_SHIPPING');

-- CreateEnum
CREATE TYPE "PackagingType" AS ENUM ('FRAMED', 'ROLLED');

-- AlterTable
ALTER TABLE "series" ADD COLUMN     "introduction" TEXT,
ADD COLUMN     "artistStatement" TEXT,
ADD COLUMN     "filmUrl" TEXT;

-- AlterTable
ALTER TABLE "artworks" ADD COLUMN     "reservedUntil" TIMESTAMP(3),
ADD COLUMN     "reservedByUserId" TEXT;

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "directions" TEXT,
ADD COLUMN     "openingHours" TEXT,
ADD COLUMN     "artistTalkAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "deliveryMethod" "DeliveryMethod",
ADD COLUMN     "deliveryAddress" TEXT,
ADD COLUMN     "packaging" "PackagingType",
ADD COLUMN     "deliveryFee" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "subscribers" ADD COLUMN     "userId" TEXT;

-- CreateTable
CREATE TABLE "series_media_files" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "type" "MediaFileType" NOT NULL,
    "description" TEXT,
    "thumbnailUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "seriesId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "series_media_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_rsvps" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" INTEGER NOT NULL,
    "status" "RsvpStatus" NOT NULL DEFAULT 'GOING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_rsvps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_media_files" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "type" "MediaFileType" NOT NULL,
    "description" TEXT,
    "thumbnailUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "eventId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_media_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "press_mentions" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publication" TEXT,
    "publishedAt" TIMESTAMP(3),
    "eventId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "press_mentions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlist_items" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "artworkId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wishlist_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_rsvps_userId_eventId_key" ON "event_rsvps"("userId", "eventId");

-- CreateIndex
CREATE UNIQUE INDEX "wishlist_items_userId_artworkId_key" ON "wishlist_items"("userId", "artworkId");

-- CreateIndex
CREATE UNIQUE INDEX "subscribers_userId_key" ON "subscribers"("userId");

-- AddForeignKey
ALTER TABLE "artworks" ADD CONSTRAINT "artworks_reservedByUserId_fkey" FOREIGN KEY ("reservedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscribers" ADD CONSTRAINT "subscribers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "series_media_files" ADD CONSTRAINT "series_media_files_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_rsvps" ADD CONSTRAINT "event_rsvps_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_rsvps" ADD CONSTRAINT "event_rsvps_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_media_files" ADD CONSTRAINT "event_media_files_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "press_mentions" ADD CONSTRAINT "press_mentions_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_artworkId_fkey" FOREIGN KEY ("artworkId") REFERENCES "artworks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
