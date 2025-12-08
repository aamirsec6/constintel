-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "brand_id" TEXT,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "email_verify_token" TEXT,
    "reset_password_token" TEXT,
    "reset_password_expires" TIMESTAMP(3),
    "last_login" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT,
    "industry" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "status" TEXT NOT NULL DEFAULT 'active',
    "instance_id" TEXT,
    "instance_config" JSONB,
    "settings" JSONB,
    "api_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_activity_at" TIMESTAMP(3),

    CONSTRAINT "brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brand_metrics" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "revenue_growth" DOUBLE PRECISION,
    "mrr" DECIMAL(12,2),
    "customer_count" INTEGER NOT NULL DEFAULT 0,
    "new_customers" INTEGER NOT NULL DEFAULT 0,
    "churn_rate" DOUBLE PRECISION,
    "order_count" INTEGER NOT NULL DEFAULT 0,
    "order_value" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "avg_order_value" DECIMAL(12,2),
    "engagement_score" DOUBLE PRECISION,
    "active_customers" INTEGER NOT NULL DEFAULT 0,
    "retention_rate" DOUBLE PRECISION,
    "ml_impact_score" DOUBLE PRECISION,
    "churn_reduction" DOUBLE PRECISION,
    "ltv_increase" DOUBLE PRECISION,
    "usage_score" DOUBLE PRECISION,
    "api_calls" INTEGER NOT NULL DEFAULT 0,
    "features_used" JSONB,
    "performance_score" DOUBLE PRECISION,
    "trend" TEXT,
    "previous_score" DOUBLE PRECISION,

    CONSTRAINT "brand_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brand_metrics_history" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "revenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "customer_count" INTEGER NOT NULL DEFAULT 0,
    "order_count" INTEGER NOT NULL DEFAULT 0,
    "performance_score" DOUBLE PRECISION,
    "trend" TEXT,

    CONSTRAINT "brand_metrics_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "user_email_idx" ON "user"("email");

-- CreateIndex
CREATE INDEX "user_brand_id_idx" ON "user"("brand_id");

-- CreateIndex
CREATE INDEX "user_role_idx" ON "user"("role");

-- CreateIndex
CREATE UNIQUE INDEX "brand_instance_id_key" ON "brand"("instance_id");

-- CreateIndex
CREATE UNIQUE INDEX "brand_api_key_key" ON "brand"("api_key");

-- CreateIndex
CREATE INDEX "brand_status_idx" ON "brand"("status");

-- CreateIndex
CREATE INDEX "brand_plan_idx" ON "brand"("plan");

-- CreateIndex
CREATE INDEX "brand_created_at_idx" ON "brand"("created_at");

-- CreateIndex
CREATE INDEX "brand_metrics_brand_id_date_idx" ON "brand_metrics"("brand_id", "date");

-- CreateIndex
CREATE INDEX "brand_metrics_date_idx" ON "brand_metrics"("date");

-- CreateIndex
CREATE INDEX "brand_metrics_performance_score_idx" ON "brand_metrics"("performance_score");

-- CreateIndex
CREATE UNIQUE INDEX "brand_metrics_brand_id_date_key" ON "brand_metrics"("brand_id", "date");

-- CreateIndex
CREATE INDEX "brand_metrics_history_brand_id_date_idx" ON "brand_metrics_history"("brand_id", "date");

-- CreateIndex
CREATE INDEX "brand_metrics_history_date_idx" ON "brand_metrics_history"("date");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_metrics" ADD CONSTRAINT "brand_metrics_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_metrics_history" ADD CONSTRAINT "brand_metrics_history_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;
