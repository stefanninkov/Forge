-- CreateEnum
CREATE TYPE "audit_type" AS ENUM ('SPEED', 'SEO', 'AEO');

-- CreateEnum
CREATE TYPE "alert_severity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "alert_type" AS ENUM ('SCORE_DROP', 'ISSUE_FOUND', 'NEW_ERROR');

-- CreateTable
CREATE TABLE "audits" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "type" "audit_type" NOT NULL,
    "url_audited" TEXT NOT NULL,
    "results" JSONB NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_alerts" (
    "id" UUID NOT NULL,
    "audit_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "type" "alert_type" NOT NULL,
    "message" TEXT NOT NULL,
    "severity" "alert_severity" NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audits_project_id_idx" ON "audits"("project_id");

-- CreateIndex
CREATE INDEX "audits_type_idx" ON "audits"("type");

-- CreateIndex
CREATE INDEX "audit_alerts_project_id_idx" ON "audit_alerts"("project_id");

-- AddForeignKey
ALTER TABLE "audits" ADD CONSTRAINT "audits_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_alerts" ADD CONSTRAINT "audit_alerts_audit_id_fkey" FOREIGN KEY ("audit_id") REFERENCES "audits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_alerts" ADD CONSTRAINT "audit_alerts_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
