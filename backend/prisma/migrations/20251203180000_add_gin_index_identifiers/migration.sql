-- GENERATOR: PERFORMANCE_OPTIMIZATION
-- Add GIN index on identifiers JSONB column for fast lookups
-- HOW TO RUN: This migration is automatically applied via Prisma

-- Create GIN index on identifiers column for fast JSONB queries
CREATE INDEX IF NOT EXISTS idx_customer_profile_identifiers_gin 
ON customer_profile USING GIN (identifiers);

-- Add comment
COMMENT ON INDEX idx_customer_profile_identifiers_gin IS 
'GIN index on identifiers JSONB column for fast lookups by phone, email, loyalty_id, etc.';

