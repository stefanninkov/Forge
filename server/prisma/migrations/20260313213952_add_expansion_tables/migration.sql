-- CreateEnum
CREATE TYPE "script_status" AS ENUM ('SYNCED', 'OUTDATED', 'NOT_DEPLOYED', 'ERROR');

-- CreateEnum
CREATE TYPE "activity_action" AS ENUM ('PROJECT_CREATED', 'PROJECT_UPDATED', 'PROJECT_DELETED', 'AUDIT_RUN', 'TEMPLATE_CREATED', 'TEMPLATE_PUSHED', 'ANIMATION_APPLIED', 'SCRIPT_DEPLOYED', 'SECTION_CAPTURED', 'FIGMA_ANALYZED', 'SETTINGS_UPDATED');

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "last_deployed_at" TIMESTAMP(3),
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "script_config" JSONB,
ADD COLUMN     "script_status" "script_status" NOT NULL DEFAULT 'NOT_DEPLOYED';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "preferences" JSONB DEFAULT '{}';

-- CreateTable
CREATE TABLE "favorites" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "project_id" UUID,
    "template_id" UUID,
    "preset_id" UUID,
    "type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "project_id" UUID,
    "action" "activity_action" NOT NULL,
    "details" JSONB,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "captured_sections" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "project_id" UUID,
    "folder_id" UUID,
    "name" TEXT NOT NULL,
    "html" TEXT NOT NULL,
    "css" TEXT NOT NULL,
    "attributes" JSONB NOT NULL DEFAULT '{}',
    "element_count" INTEGER NOT NULL DEFAULT 0,
    "thumbnail" TEXT,
    "captured_from" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "captured_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "section_folders" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "parent_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "section_folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scaling_configs" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "project_id" UUID,
    "name" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scaling_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "channel" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "handoff_reports" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "sections" JSONB NOT NULL,
    "branding" JSONB,
    "share_token" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "handoff_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "favorites_user_id_idx" ON "favorites"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_user_id_type_project_id_key" ON "favorites"("user_id", "type", "project_id");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_user_id_type_template_id_key" ON "favorites"("user_id", "type", "template_id");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_user_id_type_preset_id_key" ON "favorites"("user_id", "type", "preset_id");

-- CreateIndex
CREATE INDEX "activity_logs_user_id_idx" ON "activity_logs"("user_id");

-- CreateIndex
CREATE INDEX "activity_logs_project_id_idx" ON "activity_logs"("project_id");

-- CreateIndex
CREATE INDEX "activity_logs_created_at_idx" ON "activity_logs"("created_at");

-- CreateIndex
CREATE INDEX "captured_sections_user_id_idx" ON "captured_sections"("user_id");

-- CreateIndex
CREATE INDEX "captured_sections_project_id_idx" ON "captured_sections"("project_id");

-- CreateIndex
CREATE INDEX "captured_sections_folder_id_idx" ON "captured_sections"("folder_id");

-- CreateIndex
CREATE INDEX "section_folders_user_id_idx" ON "section_folders"("user_id");

-- CreateIndex
CREATE INDEX "scaling_configs_user_id_idx" ON "scaling_configs"("user_id");

-- CreateIndex
CREATE INDEX "scaling_configs_project_id_idx" ON "scaling_configs"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_user_id_channel_event_key" ON "notification_preferences"("user_id", "channel", "event");

-- CreateIndex
CREATE UNIQUE INDEX "handoff_reports_share_token_key" ON "handoff_reports"("share_token");

-- CreateIndex
CREATE INDEX "handoff_reports_user_id_idx" ON "handoff_reports"("user_id");

-- CreateIndex
CREATE INDEX "handoff_reports_project_id_idx" ON "handoff_reports"("project_id");

-- CreateIndex
CREATE INDEX "handoff_reports_share_token_idx" ON "handoff_reports"("share_token");

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "captured_sections" ADD CONSTRAINT "captured_sections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "captured_sections" ADD CONSTRAINT "captured_sections_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "captured_sections" ADD CONSTRAINT "captured_sections_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "section_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "section_folders" ADD CONSTRAINT "section_folders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "section_folders" ADD CONSTRAINT "section_folders_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "section_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scaling_configs" ADD CONSTRAINT "scaling_configs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scaling_configs" ADD CONSTRAINT "scaling_configs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handoff_reports" ADD CONSTRAINT "handoff_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handoff_reports" ADD CONSTRAINT "handoff_reports_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
