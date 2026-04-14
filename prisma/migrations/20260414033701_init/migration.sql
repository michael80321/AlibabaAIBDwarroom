-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "industry" TEXT,
    "region" TEXT,
    "company_size" TEXT,
    "website" TEXT,
    "current_cloud" TEXT,
    "priority_label" TEXT NOT NULL DEFAULT 'Monitor',
    "priority_score" INTEGER NOT NULL DEFAULT 0,
    "entry_points" TEXT[],
    "estimated_arr" INTEGER,
    "why_now" TEXT,
    "opening_pitch" TEXT,
    "pain_points" TEXT[],
    "tech_stack" TEXT[],
    "last_contacted" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "email" TEXT,
    "linkedin_url" TEXT,
    "influence" TEXT NOT NULL DEFAULT 'unknown',
    "notes" TEXT,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_scores" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "pain_signal" INTEGER NOT NULL DEFAULT 0,
    "budget_signal" INTEGER NOT NULL DEFAULT 0,
    "timeline_signal" INTEGER NOT NULL DEFAULT 0,
    "tech_fit" INTEGER NOT NULL DEFAULT 0,
    "competitor_issue" INTEGER NOT NULL DEFAULT 0,
    "china_expansion" INTEGER NOT NULL DEFAULT 0,
    "ai_gpu_demand" INTEGER NOT NULL DEFAULT 0,
    "decision_maker_access" INTEGER NOT NULL DEFAULT 0,
    "relationship_warmth" INTEGER NOT NULL DEFAULT 0,
    "company_size_fit" INTEGER NOT NULL DEFAULT 0,
    "total_score" INTEGER NOT NULL DEFAULT 0,
    "ai_reason" TEXT,
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pipeline_stages" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "entered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expected_close" TIMESTAMP(3),
    "deal_value" INTEGER,
    "blockers" TEXT,
    "risk_level" TEXT NOT NULL DEFAULT 'medium',
    "next_action" TEXT,
    "next_action_due" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "pipeline_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_notes" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "meeting_date" TIMESTAMP(3) NOT NULL,
    "raw_notes" TEXT NOT NULL,
    "summary" TEXT,
    "decision_makers" TEXT,
    "pain_points" TEXT,
    "objections" TEXT,
    "budget_timeline" TEXT,
    "next_steps" TEXT,
    "updated_pitch" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meeting_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cloud_vendor_news" (
    "id" TEXT NOT NULL,
    "vendor" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "url" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "credibility" INTEGER NOT NULL DEFAULT 2,
    "category" TEXT NOT NULL,
    "published_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cloud_vendor_news_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_status" (
    "id" TEXT NOT NULL,
    "vendor" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "previous_status" TEXT,
    "incident" TEXT,
    "affected_services" TEXT[],
    "checked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "status_incidents" (
    "id" TEXT NOT NULL,
    "vendor" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    "telegram_sent" BOOLEAN NOT NULL DEFAULT false,
    "affected_customers" TEXT[],

    CONSTRAINT "status_incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partners" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "services" TEXT[],
    "regions" TEXT[],
    "cloud_alliances" TEXT[],
    "cooperation_type" TEXT NOT NULL DEFAULT 'monitor',
    "contact_info" TEXT,
    "notes" TEXT,

    CONSTRAINT "partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_strategies" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "top3_actions" JSONB NOT NULL,
    "weekly_focus" TEXT,
    "monthly_direction" TEXT,
    "abandon_list" JSONB,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_strategies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customer_scores_customer_id_key" ON "customer_scores"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "daily_strategies_date_key" ON "daily_strategies"("date");

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_scores" ADD CONSTRAINT "customer_scores_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipeline_stages" ADD CONSTRAINT "pipeline_stages_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_notes" ADD CONSTRAINT "meeting_notes_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
