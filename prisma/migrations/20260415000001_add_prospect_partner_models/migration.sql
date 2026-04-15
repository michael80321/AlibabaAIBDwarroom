-- CreateTable
CREATE TABLE "prospect_recommendations" (
    "id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "description" TEXT,
    "why_alibaba" TEXT,
    "estimated_arr" INTEGER,
    "website" TEXT,
    "contact_hint" TEXT,
    "headcount" TEXT,
    "tech_stack" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'new',
    "status_reason" TEXT,
    "recommended_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prospect_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_prospects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "description" TEXT,
    "services" TEXT[],
    "why_partner" TEXT,
    "cooperation_type" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "status_reason" TEXT,
    "recommended_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_prospects_pkey" PRIMARY KEY ("id")
);
