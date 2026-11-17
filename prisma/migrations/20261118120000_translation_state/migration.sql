-- CreateEnum
CREATE TYPE "TranslationStatus" AS ENUM ('PENDING', 'DONE', 'FAILED', 'STALE', 'LEGACY');

-- CreateTable
CREATE TABLE "TranslationState" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "status" "TranslationStatus" NOT NULL DEFAULT 'PENDING',
    "sourceHash" TEXT,
    "latestHash" TEXT,
    "provider" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "translatedAt" TIMESTAMP(3),
    "fields" JSONB,
    "legacyBackup" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TranslationState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TranslationState_status_idx" ON "TranslationState"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TranslationState_entityType_entityId_locale_key" ON "TranslationState"("entityType", "entityId", "locale");

