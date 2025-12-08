# Expected Outcomes for Real-World Data Scenarios

**Last Updated**: December 2024  
**Purpose**: Document what to expect when real-world data flows through ConstIntel

---

## Table of Contents

1. [Database State Changes](#database-state-changes)
2. [Profile Merging Outcomes](#profile-merging-outcomes)
3. [ML Predictions Accuracy](#ml-predictions-accuracy)
4. [Automation Executions](#automation-executions)
5. [Journey Stage Transitions](#journey-stage-transitions)
6. [Cache Updates](#cache-updates)
7. [Verification Queries](#verification-queries)

---

## Database State Changes

### After Scenario 1: Omnichannel Journey

#### Tables Affected

**`customer_profile`**:
- **Expected Records**: 1 (after merge)
- **Profile Fields**:
  - `identifiers`: `{ email: "sarah.johnson@email.com", phone: "15550123", whatsapp: "+15550123", loyalty_id: "LOY-789456" }`
  - `profile_strength`: 85% (multiple identifier types)
  - `lifetime_value`: $215.49 (sum of all purchases)
  - `total_orders`: 2
  - `created_at`: Date of first event
  - `updated_at`: Date of last merge/update

**`customer_raw_event`**:
- **Expected Records**: 5
- **Event Types**: `purchase` (2), `whatsapp_message` (1), `store_visit` (1), `cart_add` (1)
- **All events**: `customer_profile_id` should point to unified profile

**`merge_history`**:
- **Expected Records**: 1-2 (depending on merge sequence)
- **Fields**:
  - `base_profile_id`: Main profile ID
  - `merged_profile_id`: Profile that was merged
  - `reason`: "identifier_match"
  - `before_snapshot`: JSON with profile states before merge
  - `after_snapshot`: JSON with merged profile state

**`store_visit`**:
- **Expected Records**: 1
- **Fields**:
  - `customer_profile_id`: Unified profile ID
  - `store_id`: "STORE-001"
  - `check_in_at`: Timestamp
  - `check_out_at`: Timestamp
  - `duration`: 45 minutes

**`product_intent`**:
- **Expected Records**: 2
- **Products**: "Summer Collection T-Shirt", "Premium Sneakers"
- **Intent Scores**: Varies based on purchase/view behavior

**`automation_execution`**:
- **Expected Records**: 1 (if cart abandonment automation is configured)
- **Status**: "executed"
- **Trigger Reason**: "cart_abandonment"

**`campaign_execution`**:
- **Expected Records**: 1 (if automation sends message)
- **Channel**: "whatsapp"
- **Status**: "sent" or "delivered"

**`features`**:
- **Expected Records**: Multiple (one per feature type)
- **Feature Types**: `recency`, `frequency`, `monetary`, `category_affinity`, `profile_strength`

**`predictions`**:
- **Expected Records**: 1
- **Fields**:
  - `churn_score`: 0.15 (15% - low risk)
  - `ltv_score`: 450.00 (predicted LTV)
  - `segment`: "loyal_customer"
  - `recommendations`: JSON array of product recommendations

**`customer_journey`**:
- **Expected Records**: 1
- **Fields**:
  - `current_stage`: "retention"
  - `journey_score`: 78 (out of 100)
  - `next_best_action`: "Send personalized product recommendations"

---

## Profile Merging Outcomes

### Auto-Merge (≤ 3 Profiles)

**When**: 2-3 profiles match via identifiers

**Expected Behavior**:
1. Profiles automatically merged
2. Base profile selected (highest strength, oldest)
3. All identifiers combined
4. Lifetime values and orders summed
5. All events re-attached to base profile
6. Merge history record created
7. Merged profiles deleted

**Database Changes**:
- `customer_profile`: Count decreases by (N-1) where N = profiles merged
- `merge_history`: 1 new record
- `customer_raw_event`: All events updated to point to base profile

**Example**:
- Before: 3 profiles (prof-001, prof-002, prof-003)
- After: 1 profile (prof-001, merged)
- `merge_history`: 2 records (prof-002 → prof-001, prof-003 → prof-001)

### Manual Review (> 3 Profiles)

**When**: 4+ profiles match via identifiers

**Expected Behavior**:
1. Auto-merge blocked
2. Entry created in `manual_merge_queue`
3. Status: "pending"
4. Admin reviews and approves/rejects
5. If approved: Manual merge executed
6. If rejected: Profiles remain separate

**Database Changes**:
- `manual_merge_queue`: 1 new record
- `customer_profile`: Profiles remain separate until merge approved
- `merge_history`: Created only after manual approval

**Example**:
- Before: 5 profiles
- `manual_merge_queue`: 1 record with all 5 profile IDs
- After approval: 1 merged profile, 4 deleted
- `merge_history`: 1 record documenting the merge

---

## ML Predictions Accuracy

### Churn Prediction

**Input Features**:
- Recency: Days since last purchase
- Frequency: Total purchase count
- Monetary: Total lifetime value
- Profile Strength: Identifier completeness
- Category Affinity: Purchase distribution

**Expected Output**:
- **Low Risk** (0-30%): Active customers, recent purchases
- **Medium Risk** (30-60%): Some inactivity, moderate engagement
- **High Risk** (60-100%): Long inactivity, low engagement

**Example Scenarios**:
- **Active Customer** (purchased 2 days ago, 5 purchases): Churn 8-15%
- **At-Risk Customer** (purchased 45 days ago, 3 purchases): Churn 70-80%
- **Churned Customer** (purchased 90+ days ago, 1 purchase): Churn 85-95%

### LTV Prediction

**Input Features**: Same as churn prediction

**Expected Output**:
- Dollar amount representing predicted lifetime value
- Based on historical spending patterns and frequency

**Example Scenarios**:
- **New Customer** (1 purchase, $50): LTV $100-200
- **Regular Customer** (5 purchases, $450): LTV $800-1200
- **High-Value Customer** (10+ purchases, $2000+): LTV $3000-5000

### Segmentation

**Clusters**:
- **Champions**: High frequency, high monetary, recent
- **Loyal Customers**: High frequency, medium monetary, recent
- **Potential Loyalists**: Medium frequency, high monetary, recent
- **New Customers**: Low frequency, any monetary, very recent
- **At Risk**: Any frequency, any monetary, low recency
- **Lost**: Any frequency, any monetary, very low recency

**Expected Assignments**:
- Active repeat customer → "champions" or "loyal_customers"
- New customer → "new_customers"
- Inactive customer → "at_risk" or "lost"

---

## Automation Executions

### Cart Abandonment Automation

**Trigger Conditions**:
- Event: `cart_add`
- Time window: 2 hours since cart add
- No purchase event in time window

**Expected Behavior**:
1. Automation evaluates after 2 hours
2. If conditions met: Automation triggers
3. Action executed: Send WhatsApp/Email message
4. Execution record created
5. Campaign execution record created

**Database Changes**:
- `automation_execution`: 1 record
  - `status`: "executed"
  - `trigger_reason`: "cart_abandonment"
  - `triggered_at`: Timestamp
- `campaign_execution`: 1 record
  - `channel`: "whatsapp" or "email"
  - `status`: "sent"
  - `sent_at`: Timestamp

### Churn Risk Automation

**Trigger Conditions**:
- Churn score ≥ threshold (e.g., 0.70)
- Segment = "at_risk"

**Expected Behavior**:
1. Automation evaluates after prediction update
2. If conditions met: Automation triggers
3. Action executed: Send retention message/offer
4. Execution record created

**Database Changes**:
- `automation_execution`: 1 record
  - `status`: "executed"
  - `trigger_reason`: "churn_risk"
- `campaign_execution`: 1 record
  - `channel`: "whatsapp", "email", or "sms"

### LTV Milestone Automation

**Trigger Conditions**:
- Lifetime value ≥ threshold (e.g., $500)
- Segment = "champion"

**Expected Behavior**:
1. Automation evaluates after profile update
2. If conditions met: Automation triggers
3. Action executed: Send VIP offer/thank you message
4. Execution record created

**Database Changes**:
- `automation_execution`: 1 record
  - `status`: "executed"
  - `trigger_reason`: "ltv_milestone"

---

## Journey Stage Transitions

### Stage Definitions

**Awareness**:
- First touchpoint
- No purchases
- Browsing behavior only

**Consideration**:
- Product views > 3
- Cart additions
- Search queries
- No purchase yet

**Purchase**:
- First purchase made
- Low frequency (1-2 purchases)

**Retention**:
- 3+ purchases
- Regular engagement
- Multiple channels used

**Advocacy**:
- High LTV
- Frequent purchases
- Referral activity
- High engagement score

### Expected Transitions

**New Customer Journey**:
1. Awareness → Consideration (after browsing)
2. Consideration → Purchase (after first purchase)
3. Purchase → Retention (after 3+ purchases)

**At-Risk Customer**:
- Retention → At-Risk (after 30+ days inactivity)
- At-Risk → Retention (after re-engagement)

**High-Value Customer**:
- Retention → Advocacy (after high LTV + frequency)

### Journey Score Calculation

**Factors**:
- Engagement frequency: 40%
- Purchase value: 30%
- Channel diversity: 20%
- Recency: 10%

**Score Ranges**:
- 0-30: Awareness/Consideration
- 30-50: Purchase
- 50-70: Retention
- 70-85: Strong Retention
- 85-100: Advocacy

---

## Cache Updates

### Redis Cache Invalidation

**When Cache is Invalidated**:
1. Profile merge occurs
2. New event ingested
3. ML predictions updated
4. Journey stage changes
5. Manual cache clear

**Cache Keys**:
- `customer:360:${brandId}:${profileId}`: Customer 360 view
- `profile:${brandId}:${profileId}`: Profile data
- `predictions:${brandId}:${profileId}`: ML predictions

**Expected Behavior**:
- Cache invalidated immediately after data change
- Next request rebuilds cache
- Cache TTL: 5 minutes (configurable)

### Cache Rebuild

**After Invalidation**:
1. Next API request triggers cache rebuild
2. Data fetched from database
3. Cache populated with fresh data
4. Response returned to client

**Performance**:
- First request after invalidation: Slower (database query)
- Subsequent requests: Fast (cache hit)

---

## Verification Queries

### Check Profile State

```sql
-- Get unified profile
SELECT 
  id,
  identifiers,
  profile_strength,
  lifetime_value,
  total_orders,
  created_at,
  updated_at
FROM customer_profile
WHERE brand_id = 'test-brand'
  AND (identifiers->>'email' = 'sarah.johnson@email.com'
    OR identifiers->>'phone' = '15550123');
```

### Check Events

```sql
-- Get all events for a profile
SELECT 
  id,
  event_type,
  payload,
  created_at
FROM customer_raw_event
WHERE customer_profile_id = 'PROFILE_ID'
ORDER BY created_at DESC;
```

### Check Merge History

```sql
-- Get merge history
SELECT 
  id,
  base_profile_id,
  merged_profile_id,
  reason,
  before_snapshot,
  after_snapshot,
  created_at
FROM merge_history
WHERE base_profile_id = 'PROFILE_ID'
ORDER BY created_at DESC;
```

### Check ML Predictions

```sql
-- Get predictions
SELECT 
  profile_id,
  churn_score,
  ltv_score,
  segment,
  recommendations,
  model_version,
  created_at
FROM predictions
WHERE profile_id = 'PROFILE_ID'
ORDER BY created_at DESC
LIMIT 1;
```

### Check Automations

```sql
-- Get automation executions
SELECT 
  id,
  automation_id,
  profile_id,
  status,
  trigger_reason,
  triggered_at,
  executed_at
FROM automation_execution
WHERE profile_id = 'PROFILE_ID'
ORDER BY triggered_at DESC;
```

### Check Journey

```sql
-- Get journey state
SELECT 
  profile_id,
  current_stage,
  previous_stage,
  journey_score,
  next_milestone,
  next_best_action,
  updated_at
FROM customer_journey
WHERE profile_id = 'PROFILE_ID';
```

### Check Manual Merge Queue

```sql
-- Get pending merges
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

### Check Product Intents

```sql
-- Get active product intents
SELECT 
  id,
  product_id,
  product_name,
  intent_score,
  intent_type,
  last_seen_at
FROM product_intent
WHERE customer_profile_id = 'PROFILE_ID'
  AND status = 'active'
ORDER BY intent_score DESC;
```

---

## Expected API Responses

### Customer 360 Endpoint

**Endpoint**: `GET /api/profiles/:id/360`

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "profile": {
      "id": "prof-001",
      "identifiers": {
        "email": "sarah.johnson@email.com",
        "phone": "15550123",
        "whatsapp": "+15550123",
        "loyalty_id": "LOY-789456"
      },
      "profileStrength": 85,
      "lifetimeValue": 215.49,
      "totalOrders": 2
    },
    "predictions": {
      "churnScore": 0.15,
      "ltvScore": 450.00,
      "segment": "loyal_customer",
      "recommendations": ["Premium Sneakers", "Summer Collection T-Shirt"]
    },
    "productIntents": [
      {
        "id": "intent-001",
        "productName": "Premium Sneakers",
        "intentScore": 85,
        "intentType": "high"
      }
    ],
    "storeVisits": [
      {
        "id": "visit-001",
        "storeName": "Downtown Location",
        "checkInAt": "2024-01-17T11:00:00Z",
        "duration": 45
      }
    ],
    "journey": {
      "currentStage": "retention",
      "journeyScore": 78,
      "nextBestAction": "Send personalized product recommendations"
    },
    "campaignHistory": [
      {
        "campaignName": "Cart Abandonment Recovery",
        "channel": "whatsapp",
        "status": "sent",
        "sentAt": "2024-01-19T17:00:00Z"
      }
    ]
  }
}
```

### Profiles List Endpoint

**Endpoint**: `GET /api/profiles`

**Expected Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "prof-001",
      "identifiers": {
        "email": "sarah.johnson@email.com",
        "phone": "15550123"
      },
      "profileStrength": 85,
      "lifetimeValue": 215.49,
      "totalOrders": 2,
      "lastSeenAt": "2024-01-19T15:00:00Z"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 20
  }
}
```

---

## Performance Expectations

### Event Ingestion

- **Latency**: < 100ms per event
- **Throughput**: 1000+ events/second
- **Database**: Single transaction per event

### Profile Merging

- **Latency**: < 500ms for auto-merge (2-3 profiles)
- **Latency**: < 2s for manual merge (5+ profiles)
- **Database**: Transaction with multiple updates

### ML Predictions

- **Latency**: < 1s per profile (with cached features)
- **Batch Processing**: 100+ profiles/second
- **Model Loading**: < 2s on startup

### Automation Execution

- **Latency**: < 200ms per automation evaluation
- **Action Execution**: Varies by channel (WhatsApp: 500ms, Email: 100ms)

---

## Troubleshooting

### Profiles Not Merging

**Check**:
1. Identifiers match exactly (case-sensitive for some fields)
2. Brand ID matches
3. Auto-merge enabled (`ENABLE_AUTO_MERGE=true`)
4. Profile count ≤ `MAX_AUTO_MERGE_PROFILES` (default: 3)

**Solution**:
- Check `manual_merge_queue` for pending merges
- Verify identifier extraction logic
- Check merge history for errors

### ML Predictions Not Updating

**Check**:
1. Features calculated (`features` table has records)
2. ML service running
3. Models loaded
4. Prediction request sent

**Solution**:
- Trigger feature build manually
- Check ML service logs
- Verify model versions

### Automations Not Triggering

**Check**:
1. Automation enabled
2. Trigger conditions met
3. Profile matches automation criteria
4. No recent execution (24-hour cooldown)

**Solution**:
- Review automation configuration
- Check `automation_execution` table
- Verify trigger evaluation logic

---

**Status**: Complete expected outcomes documentation ready for verification

