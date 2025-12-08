-- GENERATOR: PHASE1_WEEK1_PERFORMANCE_OPTIMIZATION
-- Add additional performance indexes for common query patterns
-- HOW TO RUN: npx prisma migrate dev

-- Verify GIN index exists (should already exist from previous migration)
CREATE INDEX IF NOT EXISTS idx_customer_profile_identifiers_gin 
ON customer_profile USING GIN (identifiers);

-- Add index on updated_at for recent activity queries
CREATE INDEX IF NOT EXISTS idx_customer_profile_updated_at 
ON customer_profile(brand_id, updated_at DESC);

-- Add index on lifetime_value for high-value customer queries
CREATE INDEX IF NOT EXISTS idx_customer_profile_ltv 
ON customer_profile(brand_id, lifetime_value DESC) 
WHERE lifetime_value > 0;

-- Add composite index for profile strength queries
CREATE INDEX IF NOT EXISTS idx_customer_profile_strength_brand 
ON customer_profile(brand_id, profile_strength DESC);

-- Add index on customer_raw_event for time-based queries
CREATE INDEX IF NOT EXISTS idx_customer_raw_event_brand_created_desc 
ON customer_raw_event(brand_id, created_at DESC);

-- Add index on predictions for segment queries
CREATE INDEX IF NOT EXISTS idx_predictions_segment 
ON predictions(segment) 
WHERE segment IS NOT NULL;

-- Add index on predictions for churn risk queries
CREATE INDEX IF NOT EXISTS idx_predictions_churn 
ON predictions(churn_score DESC) 
WHERE churn_score IS NOT NULL;

-- Add comments
COMMENT ON INDEX idx_customer_profile_updated_at IS 
'Index for querying recently updated profiles by brand';

COMMENT ON INDEX idx_customer_profile_ltv IS 
'Index for querying high-value customers by brand';

COMMENT ON INDEX idx_customer_profile_strength_brand IS 
'Composite index for profile strength queries by brand';

COMMENT ON INDEX idx_customer_raw_event_brand_created_desc IS 
'Index for time-based event queries (most recent first)';

COMMENT ON INDEX idx_predictions_segment IS 
'Index for segment-based queries';

COMMENT ON INDEX idx_predictions_churn IS 
'Index for churn risk queries (high risk first)';

