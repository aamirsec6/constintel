-- DropIndex
DROP INDEX "idx_customer_profile_identifiers_gin";

-- CreateTable
CREATE TABLE "product_intent" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "product_name" TEXT,
    "category" TEXT,
    "intent_type" TEXT NOT NULL,
    "intent_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "source_channel" TEXT NOT NULL,
    "session_id" TEXT,
    "page_url" TEXT,
    "search_query" TEXT,
    "view_duration" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'active',
    "expires_at" TIMESTAMP(3),
    "first_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "converted_at" TIMESTAMP(3),

    CONSTRAINT "product_intent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_visit" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "profile_id" TEXT,
    "store_id" TEXT NOT NULL,
    "store_name" TEXT,
    "detection_method" TEXT NOT NULL,
    "location" JSONB,
    "check_in_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "check_out_at" TIMESTAMP(3),
    "duration" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'active',
    "active_intents" JSONB,

    CONSTRAINT "store_visit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "in_store_alert" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "visit_id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "alert_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "product_ids" JSONB NOT NULL,
    "delivery_method" TEXT NOT NULL,
    "delivery_status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delivered_at" TIMESTAMP(3),
    "viewed_at" TIMESTAMP(3),

    CONSTRAINT "in_store_alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_automation" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "trigger" JSONB NOT NULL,
    "conditions" JSONB,
    "actions" JSONB NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "ab_test_enabled" BOOLEAN NOT NULL DEFAULT false,
    "ab_test_variants" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_automation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_execution" (
    "id" TEXT NOT NULL,
    "automation_id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "trigger_reason" TEXT,
    "actions_executed" JSONB,
    "error_message" TEXT,
    "triggered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executed_at" TIMESTAMP(3),
    "customerProfileId" TEXT,

    CONSTRAINT "automation_execution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "campaign_type" TEXT NOT NULL,
    "schedule" JSONB,
    "target_segment" JSONB,
    "target_channels" JSONB NOT NULL,
    "message_template" JSONB NOT NULL,
    "personalization" JSONB,
    "ab_test_enabled" BOOLEAN NOT NULL DEFAULT false,
    "ab_test_variants" JSONB,
    "duplicate_prevention" BOOLEAN NOT NULL DEFAULT true,
    "exclusion_rules" JSONB,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "scheduled_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_execution" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "message_id" TEXT,
    "sent_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "opened_at" TIMESTAMP(3),
    "clicked_at" TIMESTAMP(3),
    "converted_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error_message" TEXT,
    "ab_test_variant" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "customerProfileId" TEXT,

    CONSTRAINT "campaign_execution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "subcategory" TEXT,
    "price" DECIMAL(12,2),
    "currency" TEXT DEFAULT 'USD',
    "metadata" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "store_name" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "reserved_quantity" INTEGER NOT NULL DEFAULT 0,
    "reorder_point" INTEGER,
    "max_stock" INTEGER,
    "demand_score" DOUBLE PRECISION,
    "trending" BOOLEAN NOT NULL DEFAULT false,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_journey" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "current_stage" TEXT NOT NULL,
    "previous_stage" TEXT,
    "stage_changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "touchpoints" JSONB NOT NULL,
    "next_milestone" TEXT,
    "next_best_action" TEXT,
    "journey_score" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_journey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attribution" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "conversion_id" TEXT NOT NULL,
    "touchpoints" JSONB NOT NULL,
    "attribution_model" TEXT NOT NULL,
    "channel_credits" JSONB NOT NULL,
    "conversion_type" TEXT NOT NULL,
    "conversion_value" DECIMAL(12,2),
    "conversion_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attribution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_intent_brand_id_profile_id_status_idx" ON "product_intent"("brand_id", "profile_id", "status");

-- CreateIndex
CREATE INDEX "product_intent_product_id_status_idx" ON "product_intent"("product_id", "status");

-- CreateIndex
CREATE INDEX "product_intent_status_expires_at_idx" ON "product_intent"("status", "expires_at");

-- CreateIndex
CREATE INDEX "product_intent_profile_id_status_last_seen_at_idx" ON "product_intent"("profile_id", "status", "last_seen_at");

-- CreateIndex
CREATE INDEX "store_visit_brand_id_profile_id_check_in_at_idx" ON "store_visit"("brand_id", "profile_id", "check_in_at");

-- CreateIndex
CREATE INDEX "store_visit_store_id_check_in_at_idx" ON "store_visit"("store_id", "check_in_at");

-- CreateIndex
CREATE INDEX "store_visit_status_check_in_at_idx" ON "store_visit"("status", "check_in_at");

-- CreateIndex
CREATE INDEX "in_store_alert_store_id_delivery_status_created_at_idx" ON "in_store_alert"("store_id", "delivery_status", "created_at");

-- CreateIndex
CREATE INDEX "in_store_alert_visit_id_idx" ON "in_store_alert"("visit_id");

-- CreateIndex
CREATE INDEX "marketing_automation_brand_id_enabled_idx" ON "marketing_automation"("brand_id", "enabled");

-- CreateIndex
CREATE INDEX "marketing_automation_brand_id_priority_idx" ON "marketing_automation"("brand_id", "priority");

-- CreateIndex
CREATE INDEX "automation_execution_automation_id_triggered_at_idx" ON "automation_execution"("automation_id", "triggered_at");

-- CreateIndex
CREATE INDEX "automation_execution_profile_id_triggered_at_idx" ON "automation_execution"("profile_id", "triggered_at");

-- CreateIndex
CREATE INDEX "campaign_brand_id_status_idx" ON "campaign"("brand_id", "status");

-- CreateIndex
CREATE INDEX "campaign_brand_id_scheduled_at_idx" ON "campaign"("brand_id", "scheduled_at");

-- CreateIndex
CREATE INDEX "campaign_execution_campaign_id_status_idx" ON "campaign_execution"("campaign_id", "status");

-- CreateIndex
CREATE INDEX "campaign_execution_profile_id_sent_at_idx" ON "campaign_execution"("profile_id", "sent_at");

-- CreateIndex
CREATE INDEX "campaign_execution_status_sent_at_idx" ON "campaign_execution"("status", "sent_at");

-- CreateIndex
CREATE UNIQUE INDEX "product_product_id_key" ON "product"("product_id");

-- CreateIndex
CREATE INDEX "product_brand_id_category_idx" ON "product"("brand_id", "category");

-- CreateIndex
CREATE INDEX "product_brand_id_active_idx" ON "product"("brand_id", "active");

-- CreateIndex
CREATE INDEX "inventory_brand_id_store_id_idx" ON "inventory"("brand_id", "store_id");

-- CreateIndex
CREATE INDEX "inventory_brand_id_trending_idx" ON "inventory"("brand_id", "trending");

-- CreateIndex
CREATE INDEX "inventory_demand_score_idx" ON "inventory"("demand_score");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_product_id_store_id_key" ON "inventory"("product_id", "store_id");

-- CreateIndex
CREATE INDEX "customer_journey_brand_id_current_stage_idx" ON "customer_journey"("brand_id", "current_stage");

-- CreateIndex
CREATE INDEX "customer_journey_brand_id_journey_score_idx" ON "customer_journey"("brand_id", "journey_score");

-- CreateIndex
CREATE UNIQUE INDEX "customer_journey_profile_id_key" ON "customer_journey"("profile_id");

-- CreateIndex
CREATE INDEX "attribution_brand_id_profile_id_conversion_at_idx" ON "attribution"("brand_id", "profile_id", "conversion_at");

-- CreateIndex
CREATE INDEX "attribution_brand_id_attribution_model_idx" ON "attribution"("brand_id", "attribution_model");

-- CreateIndex
CREATE INDEX "attribution_conversion_at_idx" ON "attribution"("conversion_at");

-- AddForeignKey
ALTER TABLE "product_intent" ADD CONSTRAINT "product_intent_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "customer_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_visit" ADD CONSTRAINT "store_visit_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "customer_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "in_store_alert" ADD CONSTRAINT "in_store_alert_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "store_visit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "in_store_alert" ADD CONSTRAINT "in_store_alert_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "customer_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_execution" ADD CONSTRAINT "automation_execution_automation_id_fkey" FOREIGN KEY ("automation_id") REFERENCES "marketing_automation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_execution" ADD CONSTRAINT "automation_execution_customerProfileId_fkey" FOREIGN KEY ("customerProfileId") REFERENCES "customer_profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_execution" ADD CONSTRAINT "campaign_execution_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_execution" ADD CONSTRAINT "campaign_execution_customerProfileId_fkey" FOREIGN KEY ("customerProfileId") REFERENCES "customer_profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_journey" ADD CONSTRAINT "customer_journey_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "customer_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attribution" ADD CONSTRAINT "attribution_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "customer_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
