/*
  Warnings:

  - You are about to drop the column `artworkId` on the `transactions` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_artworkId_fkey";

-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "artworkId";
