-- AlterEnum
ALTER TYPE "OrderItemType" ADD VALUE 'ARTWORK';

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN "artworkId" INTEGER;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_artworkId_fkey" FOREIGN KEY ("artworkId") REFERENCES "artworks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
