-- Plan 10: Studio experience — release notes, founding member, studio page content

ALTER TABLE "music_releases" ADD COLUMN IF NOT EXISTS "artistNotes" TEXT;
ALTER TABLE "music_releases" ADD COLUMN IF NOT EXISTS "studioNotes" TEXT;

ALTER TABLE "music_memberships" ADD COLUMN IF NOT EXISTS "isFounding" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "music_studio_page_content" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "heroTitle" TEXT NOT NULL DEFAULT 'Step Inside the Studio',
    "heroSubtitle" TEXT NOT NULL,
    "relationshipLead" TEXT NOT NULL,
    "journeySteps" JSONB NOT NULL,
    "faq" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "music_studio_page_content_pkey" PRIMARY KEY ("id")
);
