-- CreateEnum
CREATE TYPE "template_type" AS ENUM ('SKELETON', 'STYLED');

-- CreateTable
CREATE TABLE "templates" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "type" "template_type" NOT NULL DEFAULT 'SKELETON',
    "is_preset" BOOLEAN NOT NULL DEFAULT false,
    "structure" JSONB NOT NULL,
    "styles" JSONB,
    "animation_attrs" JSONB,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "source_project_id" UUID,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "templates_user_id_idx" ON "templates"("user_id");

-- CreateIndex
CREATE INDEX "templates_category_idx" ON "templates"("category");

-- CreateIndex
CREATE INDEX "templates_is_preset_idx" ON "templates"("is_preset");
