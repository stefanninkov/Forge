-- CreateTable
CREATE TABLE "user_integrations" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "expires_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "figma_analyses" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "figma_file_key" TEXT NOT NULL,
    "figma_page_name" TEXT,
    "raw_structure" JSONB,
    "audit_results" JSONB,
    "ai_suggestions" JSONB,
    "final_structure" JSONB,
    "pushed_to_webflow" BOOLEAN NOT NULL DEFAULT false,
    "pushed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "figma_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_integrations_user_id_provider_key" ON "user_integrations"("user_id", "provider");

-- CreateIndex
CREATE INDEX "figma_analyses_project_id_idx" ON "figma_analyses"("project_id");

-- AddForeignKey
ALTER TABLE "user_integrations" ADD CONSTRAINT "user_integrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "figma_analyses" ADD CONSTRAINT "figma_analyses_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
