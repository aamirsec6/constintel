# Order and Transaction Data Processing Flow

**Last Updated**: December 2024  
**Purpose**: Document how orders and transactions flow through ConstIntel and how they're processed

---

## Table of Contents

1. [Overview](#overview)
2. [Data Flow Diagram](#data-flow-diagram)
3. [Order Processing Steps](#order-processing-steps)
4. [Transaction Processing Steps](#transaction-processing-steps)
5. [Real-World Scenarios](#real-world-scenarios)
6. [Data Updates and Calculations](#data-updates-and-calculations)

---

## Overview

When an order or transaction is received in ConstIntel, it goes through a multi-step processing pipeline that:

1. **Ingests** the raw event
2. **Extracts** customer identifiers
3. **Matches** to existing profiles (or creates new)
4. **Updates** profile statistics (LTV, order count)
5. **Triggers** automations and ML predictions
6. **Publishes** to streams for downstream processing

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    ORDER/TRANSACTION ARRIVES                    │
│  (Shopify Webhook, POS System, WooCommerce, Manual Upload)      │
└────────────────────────────┬──────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EVENT INGESTION SERVICE                       │
│  backend/src/services/ingestion/eventIngestion.ts                │
│                                                                   │
│  1. Extract identifiers (email, phone, loyalty_id)              │
│  2. Find matching profiles                                      │
│  3. Create profile if no match                                  │
│  4. Attach event to profile                                     │
└────────────────────────────┬──────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PROFILE MATCHING & MERGING                    │
│  backend/src/services/merger/profileMatcher.ts                   │
│                                                                   │
│  • Match by identifiers (priority: phone > email > loyalty)     │
│  • Auto-merge if ≤ 3 profiles match                             │
│  • Queue for manual review if > 3 profiles                       │
└────────────────────────────┬──────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PROFILE STATISTICS UPDATE                     │
│  (Triggered by event ingestion)                                  │
│                                                                   │
│  • Calculate lifetime value (sum of all purchases)              │
│  • Count total orders                                           │
│  • Update profile strength                                      │
│  • Update last seen timestamp                                   │
└────────────────────────────┬──────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    STREAM PUBLISHING                            │
│  backend/src/services/streams/eventPublisher.ts                  │
│                                                                   │
│  • Publish to events.raw stream                                  │
│  • Publish to events.normalized stream                           │
│  • Publish merge requests if profiles merged                     │
└────────────────────────────┬──────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DOWNSTREAM PROCESSING                         │
│  (Async, via stream consumers)                                   │
│                                                                   │
│  • ML Prediction Updates (churn, LTV, segmentation)            │
│  • Automation Triggers (cart abandonment, churn risk)          │
│  • Product Intent Updates                                       │
│  • Journey Stage Progression                                    │
│  • Campaign Execution                                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Order Processing Steps

### Step 1: Order Arrives (Shopify Example)

**Source**: Shopify webhook  
**Event Type**: `orders/create` or `orders/paid`

**Raw Payload**:
```json
{
  "id": 12345,
  "order_number": "#1001",
  "email": "customer@example.com",
  "phone": "+1-555-0123",
  "total_spent": "89.99",
  "line_items": [
    {
      "product_id": "PROD-001",
      "product_name": "T-Shirt",
      "quantity": 2,
      "price": "29.99"
    }
  ],
  "created_at": "2024-12-07T10:00:00Z"
}
```

### Step 2: Event Transformation

**Service**: `backend/src/services/integrations/shopify.ts`

The Shopify payload is transformed to our normalized format:

```typescript
{
  eventType: 'purchase',
  normalizedPayload: {
    email: "customer@example.com",
    phone: "+1-555-0123",
    total_spent: "89.99",
    items: [...],
    source: 'shopify',
    // ... other normalized fields
  }
}
```

### Step 3: Identifier Extraction

**Service**: `backend/src/services/merger/identifierExtractor.ts`

Extracts identifiers from the payload:
- `email`: `customer@example.com`
- `phone`: `+1-555-0123`

### Step 4: Profile Matching

**Service**: `backend/src/services/merger/profileMatcher.ts`

1. Query database for profiles matching these identifiers
2. Priority order: phone > email > loyalty_id > other
3. Results:
   - **0 matches**: Create new profile
   - **1 match**: Attach event to existing profile
   - **2-3 matches**: Auto-merge profiles, then attach event
   - **>3 matches**: Queue for manual review

### Step 5: Event Storage

**Database**: `customer_raw_event` table

```sql
INSERT INTO customer_raw_event (
  brand_id,
  event_type,
  payload,
  customer_profile_id,
  created_at
) VALUES (
  'brand-id',
  'purchase',
  '{...json payload...}',
  'profile-id',
  NOW()
);
```

### Step 6: Profile Statistics Update

**Triggered**: After event is attached to profile

**Calculations**:
```typescript
// Sum all purchase events for this profile
const purchaseEvents = await prisma.customerRawEvent.findMany({
  where: {
    customerProfileId: profileId,
    eventType: 'purchase'
  }
});

let totalLTV = 0;
let orderCount = 0;

purchaseEvents.forEach(event => {
  const payload = event.payload as any;
  totalLTV += parseFloat(payload.total_spent || payload.total || '0');
  orderCount++;
});

// Update profile
await prisma.customerProfile.update({
  where: { id: profileId },
  data: {
    lifetimeValue: totalLTV,
    totalOrders: orderCount,
    updatedAt: new Date()
  }
});
```

### Step 7: Stream Publishing

**Service**: `backend/src/services/streams/eventPublisher.ts`

Publishes to Redis streams:
- `events.raw`: Raw event data
- `events.normalized`: Normalized event with identifiers
- `merge_requests`: If profiles were merged

### Step 8: Downstream Processing

**Async Workers**: Process events from streams

1. **ML Prediction Updates**
   - Recalculate churn risk
   - Update predicted LTV
   - Re-segment customer

2. **Automation Triggers**
   - Check if order triggers any automations
   - Execute automation actions (send email, WhatsApp, etc.)

3. **Product Intent Updates**
   - Mark purchased products as "converted"
   - Update intent scores

4. **Journey Updates**
   - Update customer journey stage
   - Calculate journey score
   - Determine next best action

---

## Transaction Processing Steps

### POS Transaction Flow

**Source**: POS System (Square, Clover, etc.)  
**Event Type**: `pos_transaction`

### Step 1: POS Event Arrives

**Raw Payload**:
```json
{
  "transaction_id": "TXN-98765",
  "store_id": "STORE-001",
  "store_name": "Downtown Location",
  "customer": {
    "phone": "+1-555-0123",
    "loyalty_id": "LOY-789456"
  },
  "total": 125.50,
  "items": [
    {
      "product_id": "PROD-002",
      "product_name": "Sneakers",
      "price": "125.50",
      "quantity": 1
    }
  ],
  "payment_method": "credit_card",
  "timestamp": "2024-12-07T14:30:00Z"
}
```

### Step 2: POS Event Processing

**Service**: `backend/src/services/integrations/pos.ts`

1. **Transform** POS payload to normalized format
2. **Extract** identifiers (phone, loyalty_id)
3. **Call** `ingestEvent()` to process like any other event
4. **Detect** store visit (if customer identified)
5. **Mark** product intents as converted

### Step 3: Store Visit Detection

**Service**: `backend/src/services/store/storeVisitService.ts`

If customer is identified:
- Create `store_visit` record
- Link to customer profile
- Check for high-intent products
- Create in-store alerts if needed

---

## Real-World Scenarios

### Scenario 1: First-Time Customer Order

**Timeline**: Day 1, 10:00 AM

**Event**: Shopify order placed

**Processing**:
1. ✅ Event ingested
2. ✅ No matching profile found
3. ✅ **New profile created** (Profile ID: `prof-001`)
4. ✅ Event attached to profile
5. ✅ Profile statistics:
   - Lifetime Value: $89.99
   - Total Orders: 1
   - Profile Strength: 40% (only email identifier)
6. ✅ Published to streams
7. ✅ ML predictions generated (new customer segment)
8. ✅ Welcome automation triggered

**Database State**:
- `customer_profile`: 1 new record
- `customer_raw_event`: 1 purchase event
- `ml_prediction`: 1 new prediction record

---

### Scenario 2: Returning Customer Order

**Timeline**: Day 15, 2:00 PM

**Event**: Shopify order from existing customer

**Processing**:
1. ✅ Event ingested
2. ✅ **Profile matched** by email (`prof-001`)
3. ✅ Event attached to existing profile
4. ✅ Profile statistics updated:
   - Lifetime Value: $89.99 + $150.00 = **$239.99**
   - Total Orders: 1 + 1 = **2**
5. ✅ Published to streams
6. ✅ ML predictions updated:
   - Churn risk: Decreased (active customer)
   - Segment: Changed from "new" to "loyal"
7. ✅ Upsell automation triggered

**Database State**:
- `customer_profile`: Updated (LTV, order count)
- `customer_raw_event`: 1 new purchase event
- `ml_prediction`: Updated record

---

### Scenario 3: Multi-Channel Customer Journey

**Timeline**: 
- Day 1: Shopify order (email)
- Day 3: POS transaction (phone + loyalty_id)
- Day 5: WhatsApp inquiry (phone)

**Processing**:

**Day 1 - Shopify Order**:
1. ✅ Profile created with email (`prof-001`)
2. ✅ LTV: $89.99, Orders: 1

**Day 3 - POS Transaction**:
1. ✅ Event ingested with phone + loyalty_id
2. ✅ **Profile matched** by phone (same `prof-001`)
3. ✅ **Identifiers merged**: email + phone + loyalty_id
4. ✅ Profile strength: 40% → **85%**
5. ✅ Profile statistics updated:
   - LTV: $89.99 + $125.50 = **$215.49**
   - Orders: 1 + 1 = **2**
6. ✅ Store visit detected and linked

**Day 5 - WhatsApp Message**:
1. ✅ Event ingested with phone
2. ✅ **Profile matched** by phone (`prof-001`)
3. ✅ Event attached (no merge needed)
4. ✅ Profile strength: **85%** (maintained)

**Final State**:
- 1 unified profile (3 events merged)
- Profile Strength: 85%
- Lifetime Value: $215.49
- Total Orders: 2
- Identifiers: email, phone, loyalty_id

---

### Scenario 4: High-Value Order

**Timeline**: Day 20, 11:00 AM

**Event**: Large Shopify order ($500+)

**Processing**:
1. ✅ Event ingested and attached to profile
2. ✅ Profile statistics updated:
   - LTV: Previous + $500 = **$715.49**
   - Orders: 2 + 1 = **3**
3. ✅ ML predictions updated:
   - Segment: Changed to **"champion"**
   - Predicted LTV: Increased significantly
4. ✅ **VIP automation triggered**:
   - Welcome to VIP program
   - Exclusive offer sent
5. ✅ Journey stage: Updated to "retention"

---

## Data Updates and Calculations

### Lifetime Value (LTV) Calculation

**Formula**:
```
LTV = Sum of all purchase event totals
```

**Implementation**:
```typescript
const purchaseEvents = await prisma.customerRawEvent.findMany({
  where: {
    customerProfileId: profileId,
    eventType: { in: ['purchase', 'pos_transaction'] }
  }
});

let totalLTV = 0;
purchaseEvents.forEach(event => {
  const payload = event.payload as any;
  const total = parseFloat(
    payload.total_spent || 
    payload.total || 
    payload.amount || 
    '0'
  );
  totalLTV += total;
});

await prisma.customerProfile.update({
  where: { id: profileId },
  data: { lifetimeValue: totalLTV }
});
```

### Total Orders Calculation

**Formula**:
```
Total Orders = Count of purchase events
```

**Implementation**:
```typescript
const orderCount = await prisma.customerRawEvent.count({
  where: {
    customerProfileId: profileId,
    eventType: { in: ['purchase', 'pos_transaction'] }
  }
});

await prisma.customerProfile.update({
  where: { id: profileId },
  data: { totalOrders: orderCount }
});
```

### Profile Strength Update

**Formula**:
```
Profile Strength = (Identifier Count / Max Identifiers) * 100
```

**Identifiers**:
- Email: +20%
- Phone: +30%
- Loyalty ID: +25%
- Device ID: +10%
- Cookie ID: +5%
- Other: +10% each

**Max**: 100%

---

## Order Status Flow

### Order Lifecycle

```
pending → processing → shipped → delivered
   │           │           │
   └───────────┴───────────┘
         (cancelled)
         (refunded)
```

### Status Updates

When order status changes (e.g., `orders/updated` webhook):

1. **New event created**: `order_updated`
2. **Attached to same profile**
3. **Journey updated**: If delivered, move to "retention" stage
4. **Automation triggered**: Post-purchase follow-up

---

## Transaction Types

### 1. Shopify Orders

**Event Type**: `purchase`  
**Source**: Shopify webhooks  
**Identifiers**: email, phone  
**Data**: line_items, shipping_address, billing_address

### 2. POS Transactions

**Event Type**: `pos_transaction`  
**Source**: POS systems  
**Identifiers**: phone, loyalty_id  
**Data**: items, store_id, payment_method

### 3. WooCommerce Orders

**Event Type**: `purchase`  
**Source**: WooCommerce webhooks  
**Identifiers**: email, phone  
**Data**: line_items, customer data

### 4. Manual Orders

**Event Type**: `purchase`  
**Source**: CSV upload, API  
**Identifiers**: email, phone, loyalty_id  
**Data**: Custom structure

---

## Error Handling

### Missing Identifiers

If order has no identifiers:
- Event is still stored
- Profile is **not created**
- Event remains **unattached**
- Can be manually linked later

### Duplicate Orders

If same order is ingested twice:
- Second event is stored
- Both events attached to profile
- LTV may be double-counted (needs deduplication logic)

### Profile Merge Conflicts

If >3 profiles match:
- Queued for manual review
- Events attached to first matched profile
- Admin can approve merge later

---

## Performance Considerations

### Batch Processing

For large order imports:
- Process in batches of 100
- Use transactions for consistency
- Update profile statistics after batch

### Caching

- Profile statistics cached in Redis
- Invalidated on new order
- Refreshed on profile view

### Indexing

**Database Indexes**:
- `customer_raw_event(brand_id, event_type, created_at)`
- `customer_raw_event(customer_profile_id)`
- `customer_profile(brand_id, identifiers)` (GIN index)

---

## Testing Order Processing

### Test Order Generation

```bash
# Generate 500 orders for test brand
cd backend
npm run generate-orders -- --orders=500 --days=90

# Or with custom brand ID
npm run generate-orders -- --brand-id=your-brand-id --orders=1000 --days=180
```

### Verify Processing

```sql
-- Check orders by profile
SELECT 
  cp.id,
  cp.identifiers->>'email' as email,
  cp.lifetime_value,
  cp.total_orders,
  COUNT(cre.id) as event_count
FROM customer_profile cp
LEFT JOIN customer_raw_event cre ON cre.customer_profile_id = cp.id
WHERE cp.brand_id = 'test-brand-id'
GROUP BY cp.id
ORDER BY cp.lifetime_value DESC
LIMIT 10;
```

---

## Real-World Processing Examples

### Example 1: Shopify Order Processing

**Input**: Shopify webhook payload
```json
{
  "id": 12345,
  "email": "customer@example.com",
  "total_spent": "89.99",
  "line_items": [...]
}
```

**Processing Steps**:
1. ✅ Event transformed to normalized format
2. ✅ Identifiers extracted: `{ email: "customer@example.com" }`
3. ✅ Profile matched or created
4. ✅ Event stored in `customer_raw_event` table
5. ✅ Profile statistics updated:
   - `lifetime_value`: Previous + $89.99
   - `total_orders`: Previous + 1
6. ✅ Published to streams
7. ✅ ML predictions updated
8. ✅ Automations triggered (if applicable)

**Output**: Updated customer profile with new order data

---

### Example 2: POS Transaction Processing

**Input**: POS transaction payload
```json
{
  "transaction_id": "TXN-98765",
  "store_id": "STORE-001",
  "phone": "+1-555-0123",
  "loyalty_id": "LOY-789456",
  "total": 125.50,
  "items": [...]
}
```

**Processing Steps**:
1. ✅ POS event transformed
2. ✅ Identifiers extracted: `{ phone: "+1-555-0123", loyalty_id: "LOY-789456" }`
3. ✅ Profile matched by phone
4. ✅ Event stored
5. ✅ **Store visit detected** and linked
6. ✅ Profile statistics updated
7. ✅ Product intents marked as converted
8. ✅ In-store alerts created (if high-intent products)

**Output**: Updated profile + store visit record + alerts

---

### Example 3: Multi-Channel Order Journey

**Timeline**:
- Day 1: Website cart add (cookie_id)
- Day 2: Shopify order (email)
- Day 3: POS transaction (phone)

**Processing**:
1. **Day 1**: Profile created with cookie_id (low strength)
2. **Day 2**: 
   - Order ingested with email
   - Profile matched by email (same profile)
   - Identifiers merged: cookie_id + email
   - Profile strength: 20% → 50%
3. **Day 3**:
   - POS transaction with phone
   - Profile matched by email (same profile)
   - Identifiers merged: cookie_id + email + phone
   - Profile strength: 50% → 80%
   - Store visit detected

**Result**: Single unified profile with all identifiers and complete order history

---

## Next Steps

1. **Run order generator**: `npm run generate-orders`
2. **Verify data**: Check profiles have updated LTV and order counts
3. **View dashboards**: See revenue trends and customer metrics
4. **Test automations**: Verify order-triggered automations work

---

## Related Documentation

- [Real-World Data Scenarios](./REAL_WORLD_DATA_SCENARIOS.md)
- [Event Ingestion Service](../backend/src/services/ingestion/eventIngestion.ts)
- [Profile Merging Service](../backend/src/services/merger/profileMerger.ts)
- [Profile Statistics Service](../backend/src/services/profile/profileStatisticsService.ts)

