-- AlterTable
ALTER TABLE "brand" ADD COLUMN     "onboarding_completed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "onboarding_state" JSONB;
