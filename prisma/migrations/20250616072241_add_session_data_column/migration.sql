-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_artworkId_fkey";

-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "data" JSONB;

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "artworkIds" TEXT,
ALTER COLUMN "artworkId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_artworkId_fkey" FOREIGN KEY ("artworkId") REFERENCES "artworks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
