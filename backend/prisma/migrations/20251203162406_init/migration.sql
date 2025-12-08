-- CreateTable
CREATE TABLE "customer_raw_event" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "event_type" TEXT NOT NULL,
    "customer_profile_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_raw_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_profile" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "identifiers" JSONB NOT NULL,
    "profile_strength" INTEGER NOT NULL DEFAULT 0,
    "lifetime_value" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_orders" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "predictions" (
    "profile_id" TEXT NOT NULL,
    "churn_score" DOUBLE PRECISION,
    "ltv_score" DOUBLE PRECISION,
    "recommendations" JSONB,
    "segment" TEXT,
    "model_version" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "predictions_pkey" PRIMARY KEY ("profile_id")
);

-- CreateTable
CREATE TABLE "features" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "feature_name" TEXT NOT NULL,
    "feature_value" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "merge_history" (
    "id" TEXT NOT NULL,
    "base_profile_id" TEXT NOT NULL,
    "merged_profile_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "before_snapshot" JSONB,
    "after_snapshot" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "merge_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manual_merge_queue" (
    "id" TEXT NOT NULL,
    "profile_ids" JSONB NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manual_merge_queue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customer_raw_event_brand_id_created_at_idx" ON "customer_raw_event"("brand_id", "created_at");

-- CreateIndex
CREATE INDEX "customer_raw_event_customer_profile_id_idx" ON "customer_raw_event"("customer_profile_id");

-- CreateIndex
CREATE INDEX "customer_raw_event_event_type_idx" ON "customer_raw_event"("event_type");

-- CreateIndex
CREATE INDEX "customer_profile_brand_id_idx" ON "customer_profile"("brand_id");

-- CreateIndex
CREATE INDEX "customer_profile_profile_strength_idx" ON "customer_profile"("profile_strength");

-- CreateIndex
CREATE INDEX "features_profile_id_idx" ON "features"("profile_id");

-- CreateIndex
CREATE INDEX "features_feature_name_idx" ON "features"("feature_name");

-- CreateIndex
CREATE UNIQUE INDEX "features_profile_id_feature_name_key" ON "features"("profile_id", "feature_name");

-- CreateIndex
CREATE INDEX "merge_history_base_profile_id_idx" ON "merge_history"("base_profile_id");

-- CreateIndex
CREATE INDEX "merge_history_merged_profile_id_idx" ON "merge_history"("merged_profile_id");

-- CreateIndex
CREATE INDEX "manual_merge_queue_status_idx" ON "manual_merge_queue"("status");

-- AddForeignKey
ALTER TABLE "customer_raw_event" ADD CONSTRAINT "customer_raw_event_customer_profile_id_fkey" FOREIGN KEY ("customer_profile_id") REFERENCES "customer_profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "customer_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "features" ADD CONSTRAINT "features_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "customer_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merge_history" ADD CONSTRAINT "merge_history_base_profile_id_fkey" FOREIGN KEY ("base_profile_id") REFERENCES "customer_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merge_history" ADD CONSTRAINT "merge_history_merged_profile_id_fkey" FOREIGN KEY ("merged_profile_id") REFERENCES "customer_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
