# Testing Real-World Scenarios in ConstIntel

**Last Updated**: December 2024  
**Purpose**: Step-by-step guide to test real-world data scenarios and verify system behavior

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Setup Instructions](#setup-instructions)
3. [Scenario 1: Omnichannel Journey](#scenario-1-omnichannel-journey)
4. [Scenario 2: High-Value Customer](#scenario-2-high-value-customer)
5. [Scenario 3: Churn Risk Detection](#scenario-3-churn-risk-detection)
6. [Scenario 4: Manual Merge](#scenario-4-manual-merge)
7. [Verification Steps](#verification-steps)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Services

1. **PostgreSQL Database**
   - Running and accessible
   - Migrations applied
   - Connection string in `.env`

2. **Redis**
   - Running and accessible
   - Used for caching and streams

3. **Backend API**
   - Node.js backend running
   - Port: 3000 (default)
   - Environment variables configured

4. **ML Service** (Optional for predictions)
   - Python ML service running
   - Models trained and loaded

### Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/constintel"

# Redis
REDIS_URL="redis://localhost:6379"

# Brand ID for testing
TEST_BRAND_ID="test-brand"

# API URL
API_URL="http://localhost:3000"
```

---

## Setup Instructions

### 1. Start Services

```bash
# Start database and Redis
docker-compose -f infra/docker-compose.yml up -d

# Or start individually
docker run -d --name postgres -p 5432:5432 -e POSTGRES_PASSWORD=password postgres
docker run -d --name redis -p 6379:6379 redis
```

### 2. Run Migrations

```bash
cd backend
npx prisma migrate dev
```

### 3. Verify Setup

```bash
# Check database connection
cd backend
npx prisma studio

# Check API health
curl http://localhost:3000/health
```

### 4. Clear Existing Data (Optional)

```bash
cd backend
tsx src/scripts/clearAllData.ts
```

---

## Scenario 1: Omnichannel Journey

### Objective

Test complete omnichannel customer journey with profile merging across Shopify, WhatsApp, and POS.

### Step-by-Step Test

#### Step 1: Generate Scenario Data

```bash
cd backend
tsx src/scripts/generateRealWorldScenario.ts --scenario=omnichannel
```

**Expected Output**:
```
🎭 Generating Scenario 1: Omnichannel Customer Journey
Customer: Sarah Johnson

📦 Day 1, 10:00 AM - Shopify Purchase
   ✅ Event ingested: evt-xxx
   Profile: prof-xxx (created: true)

💬 Day 1, 2:30 PM - WhatsApp Message
   ✅ Event ingested: evt-xxx
   Profile: prof-xxx (created: true)
   🔗 Profiles merged!

🏪 Day 3, 11:00 AM - POS Store Visit & Purchase
   ✅ Event ingested: evt-xxx

🛒 Day 5, 3:00 PM - Cart Abandonment
   ✅ Event ingested: evt-xxx
```

#### Step 2: Verify Profile Creation

```bash
# Get profile by email
curl -X GET "http://localhost:3000/api/profiles" \
  -H "x-brand-id: test-brand" \
  | jq '.data[] | select(.identifiers.email == "sarah.johnson@email.com")'
```

**Expected**: Single profile with combined identifiers

#### Step 3: Check Profile Merging

```sql
-- Check merge history
SELECT * FROM merge_history 
WHERE base_profile_id IN (
  SELECT id FROM customer_profile 
  WHERE brand_id = 'test-brand' 
  AND identifiers->>'email' = 'sarah.johnson@email.com'
);
```

**Expected**: 1-2 merge history records

#### Step 4: Verify Events

```sql
-- Count events for profile
SELECT 
  event_type,
  COUNT(*) as count
FROM customer_raw_event
WHERE customer_profile_id = 'PROFILE_ID'
GROUP BY event_type;
```

**Expected**: 5 events (2 purchases, 1 whatsapp_message, 1 store_visit, 1 cart_add)

#### Step 5: Check Customer 360

```bash
# Get profile ID from step 2, then:
PROFILE_ID="prof-xxx"  # Replace with actual ID

curl -X GET "http://localhost:3000/api/profiles/${PROFILE_ID}/360" \
  -H "x-brand-id: test-brand" \
  | jq
```

**Expected Response**:
- Profile with all identifiers
- Lifetime value: $215.49
- Total orders: 2
- Product intents: 2
- Store visits: 1

#### Step 6: Verify ML Predictions (if ML service running)

```sql
SELECT 
  churn_score,
  ltv_score,
  segment,
  recommendations
FROM predictions
WHERE profile_id = 'PROFILE_ID';
```

**Expected**:
- Churn score: 0.15 (15% - low risk)
- LTV score: ~$450
- Segment: "loyal_customer"

#### Step 7: Check Automation Execution

```sql
SELECT 
  status,
  trigger_reason,
  triggered_at
FROM automation_execution
WHERE profile_id = 'PROFILE_ID';
```

**Expected**: 1 execution record for cart abandonment (if automation configured)

---

## Scenario 2: High-Value Customer

### Objective

Test identification of high-value customers through multiple purchases and ML segmentation.

### Step-by-Step Test

#### Step 1: Generate Scenario Data

```bash
cd backend
tsx src/scripts/generateRealWorldScenario.ts --scenario=high-value
```

**Expected Output**:
```
🎭 Generating Scenario 2: High-Value Customer Identification
Customer: Michael Chen

📦 Purchase 1 (7 days ago) - $199.99
   ✅ Event ingested: evt-xxx

📦 Purchase 2 (5 days ago) - $89.99
   ✅ Event ingested: evt-xxx

... (5 total purchases)
```

#### Step 2: Verify Profile

```bash
curl -X GET "http://localhost:3000/api/profiles" \
  -H "x-brand-id: test-brand" \
  | jq '.data[] | select(.identifiers.email == "michael.chen@email.com")'
```

**Expected**:
- Lifetime value: $450.00
- Total orders: 5
- Profile strength: 80%+

#### Step 3: Check ML Predictions

```sql
SELECT 
  churn_score,
  ltv_score,
  segment
FROM predictions
WHERE profile_id = 'PROFILE_ID';
```

**Expected**:
- Churn score: < 0.10 (very low)
- LTV score: $1000-1500 (high)
- Segment: "champion"

#### Step 4: Verify Automation

```sql
SELECT * FROM automation_execution
WHERE profile_id = 'PROFILE_ID'
  AND trigger_reason LIKE '%ltv%' OR trigger_reason LIKE '%segment%';
```

**Expected**: Automation execution for VIP treatment (if configured)

---

## Scenario 3: Churn Risk Detection

### Objective

Test churn risk detection and retention automation triggering.

### Step-by-Step Test

#### Step 1: Generate Scenario Data

```bash
cd backend
tsx src/scripts/generateRealWorldScenario.ts --scenario=churn-risk
```

**Expected Output**:
```
🎭 Generating Scenario 3: Churn Risk Detection & Retention
Customer: Emma Williams

📦 Creating historical purchases...
   ✅ Purchase 90 days ago - $150.00
   ✅ Purchase 60 days ago - $75.00
   ✅ Purchase 45 days ago - $100.00

⏰ Current state:
   - Last purchase: 45 days ago
   - Expected churn risk: HIGH (75%+)
   - Expected segment: "at_risk"
```

#### Step 2: Verify Profile State

```bash
curl -X GET "http://localhost:3000/api/profiles" \
  -H "x-brand-id: test-brand" \
  | jq '.data[] | select(.identifiers.email == "emma.williams@email.com")'
```

**Expected**:
- Lifetime value: $325.00 (before re-engagement)
- Total orders: 3

#### Step 3: Check ML Predictions (Before Re-engagement)

```sql
SELECT 
  churn_score,
  ltv_score,
  segment
FROM predictions
WHERE profile_id = 'PROFILE_ID'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected**:
- Churn score: 0.70-0.80 (high risk)
- Segment: "at_risk"

#### Step 4: Verify Automation Trigger

```sql
SELECT 
  status,
  trigger_reason,
  triggered_at
FROM automation_execution
WHERE profile_id = 'PROFILE_ID'
  AND trigger_reason = 'churn_risk';
```

**Expected**: Automation execution for retention campaign

#### Step 5: Check Re-engagement (After Script)

The script simulates re-engagement purchase. Verify:

```sql
SELECT 
  churn_score,
  ltv_score,
  segment
FROM predictions
WHERE profile_id = 'PROFILE_ID'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected** (after re-engagement):
- Churn score: 0.20-0.30 (decreased)
- Segment: "loyal" (improved)

---

## Scenario 4: Manual Merge

### Objective

Test profile merge with manual review when > 3 profiles match.

### Step-by-Step Test

#### Step 1: Generate Scenario Data

```bash
cd backend
tsx src/scripts/generateRealWorldScenario.ts --scenario=manual-merge
```

**Expected Output**:
```
🎭 Generating Scenario 4: Profile Merge with Manual Review
Customer: Multiple identifiers across channels

📦 Profile 1: Shopify Purchase (Email)
   ✅ Profile created: prof-xxx

💬 Profile 2: WhatsApp Message (Phone)
   ✅ Profile created: prof-xxx

🏪 Profile 3: POS Purchase (Loyalty ID + Phone)
   ✅ Profile created: prof-xxx

🌐 Profile 4: Website View (Cookie + Email)
   ✅ Profile created: prof-xxx

📱 Profile 5: Mobile App Event (Device ID + Email)
   ✅ Profile created: prof-xxx

🔗 Triggering merge detection...
   ⚠️  Note: If 5 profiles exceed merge limit, check manual_merge_queue table
```

#### Step 2: Check Manual Merge Queue

```sql
SELECT 
  id,
  profile_ids,
  reason,
  status,
  created_at
FROM manual_merge_queue
WHERE status = 'pending'
ORDER BY created_at DESC;
```

**Expected**: 1 record with 5 profile IDs

#### Step 3: Verify Profiles Exist

```sql
SELECT 
  id,
  identifiers,
  lifetime_value,
  total_orders
FROM customer_profile
WHERE id = ANY(ARRAY['prof-xxx', 'prof-xxx', ...])  -- Replace with actual IDs
ORDER BY created_at;
```

**Expected**: 5 separate profiles

#### Step 4: Approve Manual Merge (via API or Admin)

```bash
# Get queue entry ID
QUEUE_ID="queue-xxx"  # Replace with actual ID

# Approve merge (if API endpoint exists)
curl -X POST "http://localhost:3000/api/admin/merge-queue/${QUEUE_ID}/approve" \
  -H "x-brand-id: test-brand" \
  -H "Content-Type: application/json"
```

#### Step 5: Verify Merge Completed

```sql
-- Check merge history
SELECT * FROM merge_history
WHERE base_profile_id IN (
  SELECT id FROM customer_profile 
  WHERE brand_id = 'test-brand'
  AND identifiers->>'email' = 'customer@example.com'
);
```

**Expected**: 1 merge history record

#### Step 6: Verify Unified Profile

```sql
SELECT 
  id,
  identifiers,
  lifetime_value,
  total_orders,
  profile_strength
FROM customer_profile
WHERE brand_id = 'test-brand'
  AND identifiers->>'email' = 'customer@example.com';
```

**Expected**: 1 profile with:
- Combined identifiers (email, phone, loyalty_id, cookie_id, device_id)
- Combined lifetime value: $475.00
- High profile strength: 90%+

---

## Verification Steps

### General Verification Checklist

#### 1. Database Integrity

```sql
-- Check for orphaned events
SELECT COUNT(*) 
FROM customer_raw_event 
WHERE customer_profile_id IS NULL;

-- Check for duplicate profiles (should be minimal after merges)
SELECT 
  identifiers->>'email' as email,
  COUNT(*) as count
FROM customer_profile
WHERE brand_id = 'test-brand'
GROUP BY identifiers->>'email'
HAVING COUNT(*) > 1;
```

#### 2. Profile Completeness

```sql
-- Check profile strength distribution
SELECT 
  CASE 
    WHEN profile_strength >= 80 THEN 'High (80-100%)'
    WHEN profile_strength >= 60 THEN 'Medium (60-79%)'
    WHEN profile_strength >= 40 THEN 'Low (40-59%)'
    ELSE 'Very Low (<40%)'
  END as strength_category,
  COUNT(*) as count
FROM customer_profile
WHERE brand_id = 'test-brand'
GROUP BY strength_category;
```

#### 3. Event Attribution

```sql
-- Check events per profile
SELECT 
  cp.id,
  cp.profile_strength,
  COUNT(cre.id) as event_count
FROM customer_profile cp
LEFT JOIN customer_raw_event cre ON cre.customer_profile_id = cp.id
WHERE cp.brand_id = 'test-brand'
GROUP BY cp.id, cp.profile_strength
ORDER BY event_count DESC;
```

#### 4. ML Predictions Coverage

```sql
-- Check prediction coverage
SELECT 
  COUNT(DISTINCT cp.id) as total_profiles,
  COUNT(DISTINCT p.profile_id) as profiles_with_predictions,
  ROUND(100.0 * COUNT(DISTINCT p.profile_id) / COUNT(DISTINCT cp.id), 2) as coverage_percent
FROM customer_profile cp
LEFT JOIN predictions p ON p.profile_id = cp.id
WHERE cp.brand_id = 'test-brand';
```

#### 5. Automation Execution Rate

```sql
-- Check automation execution statistics
SELECT 
  trigger_reason,
  status,
  COUNT(*) as count
FROM automation_execution
WHERE profile_id IN (
  SELECT id FROM customer_profile WHERE brand_id = 'test-brand'
)
GROUP BY trigger_reason, status;
```

---

## Troubleshooting

### Issue: Profiles Not Merging

**Symptoms**:
- Multiple profiles with same identifiers
- No merge history records

**Debug Steps**:
1. Check identifier extraction:
   ```sql
   SELECT identifiers FROM customer_profile WHERE id = 'PROFILE_ID';
   ```
2. Verify identifier matching logic
3. Check auto-merge settings:
   ```bash
   echo $MAX_AUTO_MERGE_PROFILES
   echo $ENABLE_AUTO_MERGE
   ```
4. Review merge history for errors

**Solution**:
- Ensure identifiers match exactly
- Check brand_id matches
- Verify auto-merge is enabled

### Issue: ML Predictions Not Generated

**Symptoms**:
- No records in `predictions` table
- Predictions are null in API responses

**Debug Steps**:
1. Check features exist:
   ```sql
   SELECT * FROM features WHERE profile_id = 'PROFILE_ID';
   ```
2. Verify ML service is running:
   ```bash
   curl http://localhost:8000/health  # ML service port
   ```
3. Check model versions:
   ```sql
   SELECT * FROM model_version ORDER BY created_at DESC LIMIT 1;
   ```

**Solution**:
- Trigger feature build manually
- Start ML service if not running
- Train models if missing

### Issue: Automations Not Triggering

**Symptoms**:
- No records in `automation_execution` table
- Expected automations not executing

**Debug Steps**:
1. Check automations exist and are enabled:
   ```sql
   SELECT id, name, enabled, trigger FROM marketing_automation WHERE brand_id = 'test-brand';
   ```
2. Verify trigger conditions are met
3. Check for recent executions (24-hour cooldown):
   ```sql
   SELECT * FROM automation_execution 
   WHERE automation_id = 'AUTOMATION_ID' 
     AND profile_id = 'PROFILE_ID'
     AND triggered_at > NOW() - INTERVAL '24 hours';
   ```

**Solution**:
- Enable automations if disabled
- Adjust trigger thresholds if needed
- Wait for cooldown period to expire

### Issue: Events Not Attached to Profiles

**Symptoms**:
- Events have `customer_profile_id = NULL`
- Events not showing in Customer 360

**Debug Steps**:
1. Check event payloads for identifiers:
   ```sql
   SELECT payload FROM customer_raw_event WHERE customer_profile_id IS NULL LIMIT 5;
   ```
2. Verify identifier extraction logic
3. Check for matching profiles:
   ```sql
   SELECT id FROM customer_profile 
   WHERE identifiers->>'email' = 'test@example.com';
   ```

**Solution**:
- Ensure events include identifiers in payload
- Verify identifier extraction is working
- Manually attach events if needed

---

## Performance Testing

### Load Test: Multiple Events

```bash
# Generate 100 events rapidly
for i in {1..100}; do
  curl -X POST "http://localhost:3000/api/events" \
    -H "x-brand-id: test-brand" \
    -H "Content-Type: application/json" \
    -d "{\"event_type\":\"test\",\"payload\":{\"test\":$i}}" &
done
wait
```

### Stress Test: Profile Merging

```bash
# Create 10 profiles with same email, then trigger merge
for i in {1..10}; do
  tsx src/scripts/generateRealWorldScenario.ts --scenario=manual-merge &
done
wait
```

---

## Next Steps

1. **Run All Scenarios**: Execute all 4 scenarios sequentially
2. **Verify Results**: Use verification queries to check outcomes
3. **Review Logs**: Check backend and ML service logs for errors
4. **Test Edge Cases**: Try invalid data, missing identifiers, etc.
5. **Performance Test**: Load test with larger datasets

---

**Status**: Complete testing guide ready for use

