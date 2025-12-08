-- DropIndex
DROP INDEX "idx_customer_profile_identifiers_gin";

-- DropIndex
DROP INDEX "idx_customer_profile_strength_brand";

-- DropIndex
DROP INDEX "idx_customer_profile_updated_at";

-- DropIndex
DROP INDEX "idx_customer_raw_event_brand_created_desc";

-- CreateTable
CREATE TABLE "model_evaluation" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT,
    "model_type" TEXT NOT NULL,
    "results" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "model_evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "brand_id" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_event_config" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "importance" TEXT NOT NULL DEFAULT 'medium',
    "digest_frequency" TEXT NOT NULL DEFAULT 'daily',

    CONSTRAINT "notification_event_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_activity_event" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "instance_id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "event_data" JSONB NOT NULL,
    "importance" TEXT NOT NULL DEFAULT 'medium',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_activity_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_event_digest" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "instance_id" TEXT NOT NULL,
    "period_type" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "summary" JSONB NOT NULL,
    "events" JSONB NOT NULL,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_event_digest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_configuration" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT,
    "event_types" TEXT[],
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhook_configuration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "model_evaluation_brand_id_idx" ON "model_evaluation"("brand_id");

-- CreateIndex
CREATE INDEX "model_evaluation_model_type_idx" ON "model_evaluation"("model_type");

-- CreateIndex
CREATE INDEX "model_evaluation_created_at_idx" ON "model_evaluation"("created_at");

-- CreateIndex
CREATE INDEX "notification_user_id_read_idx" ON "notification"("user_id", "read");

-- CreateIndex
CREATE INDEX "notification_brand_id_idx" ON "notification"("brand_id");

-- CreateIndex
CREATE INDEX "notification_created_at_idx" ON "notification"("created_at");

-- CreateIndex
CREATE INDEX "notification_event_config_brand_id_idx" ON "notification_event_config"("brand_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_event_config_brand_id_event_type_key" ON "notification_event_config"("brand_id", "event_type");

-- CreateIndex
CREATE INDEX "customer_activity_event_brand_id_instance_id_created_at_idx" ON "customer_activity_event"("brand_id", "instance_id", "created_at");

-- CreateIndex
CREATE INDEX "customer_activity_event_event_type_idx" ON "customer_activity_event"("event_type");

-- CreateIndex
CREATE INDEX "customer_event_digest_brand_id_instance_id_created_at_idx" ON "customer_event_digest"("brand_id", "instance_id", "created_at");

-- CreateIndex
CREATE INDEX "customer_event_digest_period_type_idx" ON "customer_event_digest"("period_type");

-- CreateIndex
CREATE INDEX "webhook_configuration_brand_id_enabled_idx" ON "webhook_configuration"("brand_id", "enabled");
