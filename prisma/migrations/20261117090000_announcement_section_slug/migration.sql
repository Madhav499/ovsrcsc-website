-- AlterTable
ALTER TABLE "Announcement" ADD COLUMN     "sectionId" TEXT,
ADD COLUMN     "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Announcement_slug_key" ON "Announcement"("slug");
