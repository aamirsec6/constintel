-- CreateTable
CREATE TABLE "model_version" (
    "id" TEXT NOT NULL,
    "model_type" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "model_path" TEXT NOT NULL,
    "metrics" JSONB NOT NULL,
    "training_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "training_samples" INTEGER NOT NULL,
    "feature_count" INTEGER NOT NULL,
    "hyperparameters" JSONB,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "model_version_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "model_version_model_type_is_active_idx" ON "model_version"("model_type", "is_active");

-- CreateIndex
CREATE INDEX "model_version_training_date_idx" ON "model_version"("training_date");

-- CreateIndex
CREATE UNIQUE INDEX "model_version_model_type_version_key" ON "model_version"("model_type", "version");
