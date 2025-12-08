# Real-World Data Flow in ConstIntel

**Last Updated**: December 2024  
**Purpose**: Visualize and explain the complete data flow when real-world events are ingested into ConstIntel

---

## Table of Contents

1. [Event Ingestion Flow](#event-ingestion-flow)
2. [Profile Merging Flow](#profile-merging-flow)
3. [ML Prediction Flow](#ml-prediction-flow)
4. [Automation Flow](#automation-flow)
5. [Journey Tracking Flow](#journey-tracking-flow)
6. [Complete End-to-End Flow](#complete-end-to-end-flow)

---

## Event Ingestion Flow

### Step-by-Step Process

```
┌─────────────────────────────────────────────────────────────┐
│                   1. EVENT RECEIVED                         │
│  Source: Shopify / WhatsApp / POS / CSV / API              │
│  Format: Webhook payload, API request, CSV row             │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│             2. CREATE RAW EVENT                            │
│  Table: customer_raw_event                                 │
│  Fields:                                                    │
│    - id (UUID)                                              │
│    - brand_id                                               │
│    - event_type                                             │
│    - payload (JSON)                                         │
│    - customer_profile_id (NULL initially)                   │
│    - created_at                                             │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│           3. EXTRACT IDENTIFIERS                            │
│  Service: identifierExtractor.ts                           │
│  Extracts:                                                  │
│    - email                                                  │
│    - phone                                                  │
│    - loyalty_id                                             │
│    - device_id                                              │
│    - cookie_id                                              │
│    - whatsapp                                               │
│    - qr_id                                                  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│         4. FIND MATCHING PROFILES                            │
│  Service: profileMatcher.ts                                 │
│  Query: Search profiles with matching identifiers           │
│  Result: Array of profile IDs (0, 1, or multiple)           │
└───────────────────────┬─────────────────────────────────────┘
                        │
            ┌───────────┴───────────┐
            │                       │
            ▼                       ▼
    ┌───────────────┐      ┌──────────────────┐
    │ 0 Profiles    │      │ 1+ Profiles      │
    │ Found         │      │ Found            │
    └───────┬───────┘      └────────┬─────────┘
            │                      │
            ▼                      ▼
    ┌───────────────┐      ┌──────────────────┐
    │ CREATE NEW    │      │ USE EXISTING /   │
    │ PROFILE       │      │ MERGE PROFILES   │
    │               │      │                  │
    │ - Calculate   │      │ - Check merge    │
    │   profile     │      │   count          │
    │   strength    │      │ - Auto-merge if  │
    │ - Set initial │      │   ≤ 3 profiles   │
    │   values      │      │ - Manual review  │
    │               │      │   if > 3         │
    └───────┬───────┘      └────────┬─────────┘
            │                       │
            └───────────┬───────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│        5. ATTACH EVENT TO PROFILE                            │
│  Update: customer_raw_event.customer_profile_id             │
│  Link event to unified customer profile                     │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│        6. PUBLISH TO STREAMS (Async)                        │
│  Streams:                                                    │
│    - events.raw: Raw event data                             │
│    - events.normalized: Normalized event with identifiers   │
│    - profiles.merge_requests: If merge occurred            │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│        7. TRIGGER AUTOMATIONS (Async)                       │
│  Service: automationTrigger.ts                             │
│  Evaluate all enabled automations for this profile          │
└─────────────────────────────────────────────────────────────┘
```

### Code Flow

**File**: `backend/src/services/ingestion/eventIngestion.ts`

```typescript
1. ingestEvent(params) called
2. extractIdentifiers(payload) → ExtractedIdentifiers
3. findProfilesByIdentifiers(brandId, identifiers) → string[]
4. If 0 profiles: create new profile
5. If 1 profile: use existing
6. If 2+ profiles: mergeProfiles()
7. Create raw event with profile_id
8. Publish to Redis Streams (async)
9. Trigger automations (async)
```

---

## Profile Merging Flow

### Decision Tree

```
┌─────────────────────────────────────────────────────────────┐
│         PROFILE MERGE DECISION                              │
│  Input: Array of matching profile IDs                      │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
            ┌───────────┴───────────┐
            │                       │
            ▼                       ▼
    ┌───────────────┐      ┌──────────────────┐
    │ Count ≤ 3?    │      │ Count > 3?       │
    │               │      │                  │
    │ YES           │      │ NO               │
    └───────┬───────┘      └────────┬─────────┘
            │                       │
            ▼                       ▼
    ┌───────────────┐      ┌──────────────────┐
    │ AUTO-MERGE    │      │ MANUAL REVIEW    │
    │               │      │                  │
    │ - Acquire     │      │ - Create queue   │
    │   Redis lock  │      │   entry          │
    │ - Sort by     │      │ - Status:        │
    │   strength    │      │   "pending"      │
    │ - Merge       │      │ - Admin reviews  │
    │   identifiers │      │   and approves   │
    │ - Sum LTV &   │      │                  │
    │   orders      │      │                  │
    │ - Update      │      │                  │
    │   events      │      │                  │
    │ - Create      │      │                  │
    │   history     │      │                  │
    └───────┬───────┘      └────────┬─────────┘
            │                       │
            └───────────┬───────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│         MERGE EXECUTION                                      │
│  1. Select base profile (highest strength, oldest)           │
│  2. Combine all identifiers                                 │
│  3. Calculate new profile strength                           │
│  4. Sum lifetime values and orders                          │
│  5. Update base profile                                      │
│  6. Re-attach all events to base profile                    │
│  7. Create merge_history record                             │
│  8. Delete merged profiles                                  │
│  9. Invalidate Redis cache                                  │
└─────────────────────────────────────────────────────────────┘
```

### Merge Process Details

**File**: `backend/src/services/merger/profileMerger.ts`

**Step 1: Lock Acquisition**
- Use Redis distributed lock
- Prevents concurrent merges on same profiles
- Lock key: `merge:${baseProfileId}`
- TTL: 30 seconds

**Step 2: Profile Selection**
- Sort profiles by:
  1. Profile strength (descending)
  2. Creation date (ascending)
- Base profile = first in sorted list
- Profiles to merge = rest of list

**Step 3: Identifier Merging**
```typescript
mergedIdentifiers = {
  ...baseProfile.identifiers,
  // Add unique identifiers from merged profiles
  phone: baseProfile.phone || mergedProfile1.phone || mergedProfile2.phone,
  email: baseProfile.email || mergedProfile1.email || mergedProfile2.email,
  // ... for all identifier types
}
```

**Step 4: Value Aggregation**
```typescript
totalLTV = sum(all profiles.lifetimeValue)
totalOrders = sum(all profiles.totalOrders)
newProfileStrength = calculateProfileStrength(mergedIdentifiers)
```

**Step 5: Database Transaction**
```sql
BEGIN TRANSACTION;
  UPDATE customer_profile SET ... WHERE id = baseProfileId;
  UPDATE customer_raw_event SET customer_profile_id = baseProfileId 
    WHERE customer_profile_id IN (mergedProfileIds);
  INSERT INTO merge_history ...;
  DELETE FROM customer_profile WHERE id IN (mergedProfileIds);
COMMIT;
```

---

## ML Prediction Flow

### Feature Building → Prediction Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│        1. TRIGGER FEATURE BUILD                             │
│  Trigger: Scheduled job, manual request, or event-based     │
│  Service: services/ml_service/train/feature_builder.py     │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│        2. FETCH PROFILE DATA                                │
│  Query: Get customer profiles with events                    │
│  Include: Raw events, purchase history, timestamps           │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│        3. CALCULATE RFM FEATURES                            │
│  Features:                                                  │
│    - Recency: Days since last purchase                      │
│    - Frequency: Total number of purchases                   │
│    - Monetary: Total lifetime value                         │
│    - Category Affinity: Purchase distribution              │
│    - Profile Strength: Identifier count/quality             │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│        4. STORE FEATURES                                    │
│  Table: features                                            │
│  Structure:                                                 │
│    - profile_id                                             │
│    - feature_name (e.g., "recency", "frequency")           │
│    - feature_value (JSON)                                   │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│        5. LOAD ML MODELS                                     │
│  Service: services/ml_service/api/model_loader.py          │
│  Models:                                                    │
│    - Churn Model (LightGBM)                                 │
│    - LTV Model (LightGBM)                                   │
│    - Segmentation Model (KMeans)                            │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│        6. GENERATE PREDICTIONS                              │
│  Churn Model:                                               │
│    Input: RFM features → Output: 0-1 probability           │
│  LTV Model:                                                 │
│    Input: RFM features → Output: Dollar amount             │
│  Segmentation Model:                                        │
│    Input: RFM features → Output: Cluster assignment         │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│        7. STORE PREDICTIONS                                 │
│  Table: predictions                                         │
│  Fields:                                                    │
│    - profile_id (Primary Key)                               │
│    - churn_score                                            │
│    - ltv_score                                              │
│    - segment                                                │
│    - recommendations (JSON)                                 │
│    - model_version                                          │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│        8. UPDATE CACHE                                      │
│  Redis: Invalidate customer 360 cache                      │
│  TTL: 5 minutes (configurable)                             │
└─────────────────────────────────────────────────────────────┘
```

### Feature Calculation Details

**Recency**:
```python
last_purchase_date = max([event.created_at for event in purchase_events])
recency_days = (today - last_purchase_date).days
```

**Frequency**:
```python
frequency = len(purchase_events)
```

**Monetary**:
```python
monetary = sum([event.payload.get('total', 0) for event in purchase_events])
```

**Category Affinity**:
```python
category_counts = {}
for event in purchase_events:
    for item in event.payload.get('items', []):
        category = item.get('category', 'unknown')
        category_counts[category] = category_counts.get(category, 0) + 1
```

---

## Automation Flow

### Trigger Evaluation → Action Execution

```
┌─────────────────────────────────────────────────────────────┐
│        1. AUTOMATION TRIGGER EVENT                          │
│  Triggers:                                                  │
│    - Event ingested (onEventIngested)                     │
│    - Prediction updated (onPredictionUpdated)              │
│    - Manual trigger                                        │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│        2. FETCH ENABLED AUTOMATIONS                         │
│  Query: marketing_automation WHERE enabled = true          │
│  Order: priority DESC (higher priority first)               │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│        3. EVALUATE EACH AUTOMATION                          │
│  Service: automationService.evaluateAutomation()            │
│  For each automation:                                       │
│    - Check trigger type                                     │
│    - Evaluate trigger conditions                            │
│    - Check additional conditions                            │
└───────────────────────┬─────────────────────────────────────┘
                        │
            ┌───────────┴───────────┐
            │                       │
            ▼                       ▼
    ┌───────────────┐      ┌──────────────────┐
    │ Should        │      │ Should NOT       │
    │ Trigger?      │      │ Trigger          │
    │               │      │                  │
    │ YES           │      │ NO               │
    └───────┬───────┘      └──────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│        4. CHECK DUPLICATE PREVENTION                        │
│  Query: automation_execution WHERE                          │
│    automation_id = X AND profile_id = Y AND                 │
│    triggered_at > (now - 24 hours)                          │
│  If exists: Skip (prevent spam)                             │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│        5. CREATE EXECUTION RECORD                           │
│  Table: automation_execution                                │
│  Status: "triggered"                                        │
│  Store: trigger_reason, timestamp                           │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│        6. EXECUTE ACTIONS                                   │
│  For each action in automation.actions:                     │
│    - send_message (WhatsApp/Email/SMS)                     │
│    - update_segment                                         │
│    - trigger_campaign                                       │
│    - custom_action                                          │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│        7. UPDATE EXECUTION RECORD                          │
│  Status: "executed" or "failed"                            │
│  Store: actions_executed, executed_at                       │
│  If error: Store error_message                             │
└─────────────────────────────────────────────────────────────┘
```

### Automation Trigger Types

**1. Churn Risk Trigger**:
```typescript
if (profile.predictions?.churnScore >= trigger.threshold) {
  return true; // Trigger automation
}
```

**2. Cart Abandonment Trigger**:
```typescript
const recentCartEvent = await findRecentEvent(
  profileId, 
  'cart_add', 
  timeWindow: 2 hours
);
if (recentCartEvent && !hasRecentPurchase(profileId, 2 hours)) {
  return true; // Trigger automation
}
```

**3. Product Intent Trigger**:
```typescript
const highIntentProducts = await getHighIntentProducts(
  brandId, 
  profileId, 
  minScore: 70
);
if (highIntentProducts.length > 0) {
  return true; // Trigger automation
}
```

**4. LTV Milestone Trigger**:
```typescript
if (profile.lifetimeValue >= trigger.threshold) {
  return true; // Trigger automation
}
```

---

## Journey Tracking Flow

### Stage Detection → Journey Update

```
┌─────────────────────────────────────────────────────────────┐
│        1. JOURNEY UPDATE TRIGGER                           │
│  Triggers:                                                  │
│    - New event ingested                                    │
│    - Prediction updated                                    │
│    - Scheduled job (daily)                                 │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│        2. ANALYZE CUSTOMER BEHAVIOR                         │
│  Analyze:                                                   │
│    - Purchase history                                      │
│    - Engagement frequency                                 │
│    - Channel usage                                         │
│    - ML predictions                                        │
│    - Product interests                                     │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│        3. DETERMINE CURRENT STAGE                          │
│  Stages:                                                    │
│    - awareness: First touch, exploring                      │
│    - consideration: Browsing, comparing                     │
│    - purchase: Made first purchase                         │
│    - retention: Repeat customer                           │
│    - advocacy: High value, referrer                        │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│        4. CALCULATE JOURNEY SCORE                           │
│  Factors:                                                   │
│    - Engagement frequency (40%)                            │
│    - Purchase value (30%)                                  │
│    - Channel diversity (20%)                               │
│    - Recency (10%)                                         │
│  Score: 0-100                                               │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│        5. IDENTIFY NEXT MILESTONE                           │
│  Examples:                                                  │
│    - "likely_to_purchase_in_7_days"                         │
│    - "at_risk_of_churn"                                    │
│    - "ready_for_upsell"                                     │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│        6. DETERMINE NEXT BEST ACTION                       │
│  Based on:                                                  │
│    - Current stage                                         │
│    - ML predictions                                        │
│    - Product intents                                       │
│    - Historical behavior                                   │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│        7. UPDATE JOURNEY RECORD                            │
│  Table: customer_journey                                    │
│  Update or create:                                          │
│    - current_stage                                         │
│    - previous_stage (if changed)                           │
│    - journey_score                                         │
│    - next_milestone                                        │
│    - next_best_action                                      │
│    - touchpoints (JSON timeline)                           │
└─────────────────────────────────────────────────────────────┘
```

### Stage Detection Logic

**Awareness**:
- No purchases
- First touchpoint
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

---

## Complete End-to-End Flow

### Full Customer Journey Example

```
┌─────────────────────────────────────────────────────────────┐
│                    EVENT INGESTION                          │
│  Shopify Purchase → WhatsApp Message → POS Visit           │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                  PROFILE CREATION/MERGING                   │
│  Profile 1 (email) → Profile 2 (phone) → MERGE             │
│  Profile 3 (loyalty) → MERGE → Unified Profile             │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    FEATURE CALCULATION                      │
│  RFM Features → Category Affinity → Profile Strength        │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                      ML PREDICTIONS                         │
│  Churn Model → LTV Model → Segmentation Model              │
│  Output: Churn 15%, LTV $450, Segment "loyal"              │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    AUTOMATION EVALUATION                    │
│  Check triggers → Evaluate conditions → Execute actions     │
│  Example: Cart abandonment → Send WhatsApp message         │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    JOURNEY UPDATE                           │
│  Analyze behavior → Determine stage → Calculate score      │
│  Output: Stage "retention", Score 78/100                   │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    CACHE INVALIDATION                       │
│  Invalidate customer 360 cache → Next request rebuilds     │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow Summary

1. **Event arrives** → Raw event created
2. **Identifiers extracted** → Profile matched/created
3. **Profiles merged** (if needed) → Unified profile
4. **Features calculated** → Stored in features table
5. **ML predictions generated** → Stored in predictions table
6. **Automations evaluated** → Actions executed if triggered
7. **Journey updated** → Stage and score calculated
8. **Cache invalidated** → Fresh data on next request

---

## Key Integration Points

### Redis Streams

**Topics**:
- `events.raw`: All raw events
- `events.normalized`: Normalized events with identifiers
- `profiles.merge_requests`: Profile merge requests
- `predictions.requests`: ML prediction requests

### Database Tables

**Primary Tables**:
- `customer_raw_event`: All ingested events
- `customer_profile`: Unified customer profiles
- `merge_history`: Profile merge audit trail
- `features`: ML feature store
- `predictions`: ML predictions cache
- `automation_execution`: Automation execution log
- `customer_journey`: Journey tracking

### Services Interaction

```
Event Ingestion Service
    ↓
Profile Merger Service
    ↓
Feature Builder Service (ML)
    ↓
ML Prediction Service
    ↓
Automation Service
    ↓
Journey Service
```

---

## Performance Considerations

### Caching Strategy

1. **Profile Lookups**: Redis cache (5 min TTL)
2. **Customer 360**: Redis cache (5 min TTL)
3. **ML Predictions**: Database + Redis (1 hour TTL)
4. **Features**: Database (recalculated on demand)

### Async Processing

- Stream publishing: Async (don't block)
- Automation execution: Async (queue-based)
- ML predictions: Can be async for batch processing
- Cache invalidation: Async

### Database Optimization

- Indexes on: brand_id, identifiers (GIN), profile_id
- Connection pooling: Prisma handles
- Batch operations: Use transactions for merges

---

**Status**: Complete data flow documentation ready for reference

