-- AlterEnum
ALTER TYPE "MediaBlogEntryType" ADD VALUE 'BLOG_POST';

-- AlterTable
ALTER TABLE "media_blog_entries" ADD COLUMN     "content" TEXT,
ADD COLUMN     "duration" VARCHAR(50),
ADD COLUMN     "thumbnailUrl" VARCHAR(500);
