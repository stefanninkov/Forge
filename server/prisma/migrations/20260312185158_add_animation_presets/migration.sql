-- CreateEnum
CREATE TYPE "animation_engine" AS ENUM ('CSS', 'GSAP');

-- CreateEnum
CREATE TYPE "animation_trigger" AS ENUM ('SCROLL', 'HOVER', 'CLICK', 'LOAD');

-- CreateTable
CREATE TABLE "animation_presets" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "engine" "animation_engine" NOT NULL,
    "trigger" "animation_trigger" NOT NULL,
    "config" JSONB NOT NULL,
    "preview_html" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "animation_presets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "animation_presets_user_id_idx" ON "animation_presets"("user_id");

-- CreateIndex
CREATE INDEX "animation_presets_engine_idx" ON "animation_presets"("engine");

-- CreateIndex
CREATE INDEX "animation_presets_trigger_idx" ON "animation_presets"("trigger");

-- CreateIndex
CREATE INDEX "animation_presets_is_system_idx" ON "animation_presets"("is_system");
