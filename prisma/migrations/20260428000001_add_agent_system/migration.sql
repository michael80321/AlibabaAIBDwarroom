-- AlterTable: add agent_summary to daily_strategies
ALTER TABLE "daily_strategies" ADD COLUMN "agent_summary" JSONB;

-- CreateTable: agent_task_logs
CREATE TABLE "agent_task_logs" (
    "id" TEXT NOT NULL,
    "agent_name" TEXT NOT NULL,
    "task_type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "input" JSONB,
    "output" JSONB,
    "duration_ms" INTEGER,
    "error" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    CONSTRAINT "agent_task_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable: intervention_items
CREATE TABLE "intervention_items" (
    "id" TEXT NOT NULL,
    "agent_name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "context" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "resolved_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "intervention_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable: outreach_records
CREATE TABLE "outreach_records" (
    "id" TEXT NOT NULL,
    "prospect_id" TEXT,
    "customer_id" TEXT,
    "company_name" TEXT NOT NULL,
    "contact_name" TEXT,
    "contact_email" TEXT,
    "contact_title" TEXT,
    "scenario" TEXT NOT NULL,
    "subject_zh" TEXT,
    "body_zh" TEXT,
    "subject_en" TEXT,
    "body_en" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "approved_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "agent_task_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "outreach_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable: customer_threads
CREATE TABLE "customer_threads" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT,
    "prospect_id" TEXT,
    "company_name" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sentiment" TEXT,
    "ai_summary" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "customer_threads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "agent_task_logs_agent_name_started_at_idx" ON "agent_task_logs"("agent_name", "started_at" DESC);
CREATE INDEX "intervention_items_status_created_at_idx" ON "intervention_items"("status", "created_at" DESC);
CREATE INDEX "outreach_records_status_created_at_idx" ON "outreach_records"("status", "created_at" DESC);
