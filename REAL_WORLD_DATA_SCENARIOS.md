# Real-World Data Scenarios for ConstIntel

**Last Updated**: December 2024  
**Purpose**: Demonstrate complete end-to-end flows when real-world data is ingested into ConstIntel

---

## Table of Contents

1. [Scenario 1: Omnichannel Customer Journey](#scenario-1-omnichannel-customer-journey)
2. [Scenario 2: High-Value Customer Identification](#scenario-2-high-value-customer-identification)
3. [Scenario 3: Churn Risk Detection & Retention](#scenario-3-churn-risk-detection--retention)
4. [Scenario 4: Profile Merge with Manual Review](#scenario-4-profile-merge-with-manual-review)
5. [How to Test These Scenarios](#how-to-test-these-scenarios)

---

## Scenario 1: Omnichannel Customer Journey

### Customer Profile
- **Name**: Sarah Johnson
- **Email**: sarah.johnson@email.com
- **Phone**: +1-555-0123
- **Loyalty ID**: LOY-789456
- **Initial State**: New customer, no existing profile

### Timeline of Events

#### Day 1, 10:00 AM - Shopify Purchase

**Event Source**: Shopify Webhook  
**Event Type**: `purchase`  
**Payload**:
```json
{
  "id": 12345,
  "email": "sarah.johnson@email.com",
  "phone": null,
  "total_spent": "89.99",
  "currency": "USD",
  "items": [
    {
      "product_id": "PROD-001",
      "product_name": "Summer Collection T-Shirt",
      "category": "Apparel",
      "price": "89.99",
      "quantity": 1
    }
  ],
  "created_at": "2024-01-15T10:00:00Z",
  "order_number": "ORD-12345"
}
```

**What Happens**:

1. **Event Ingestion** (`backend/src/services/ingestion/eventIngestion.ts`)
   - Raw event created in `customer_raw_event` table
   - Event ID: `evt-001`

2. **Identifier Extraction** (`backend/src/services/merger/identifierExtractor.ts`)
   - Extracted identifiers: `{ email: "sarah.johnson@email.com" }`

3. **Profile Matching** (`backend/src/services/merger/profileMatcher.ts`)
   - No existing profiles found with this email
   - **Result**: New profile created

4. **Profile Creation**
   - Profile ID: `prof-001`
   - Profile Strength: 40% (only email identifier)
   - Lifetime Value: $89.99
   - Total Orders: 1
   - Created in `customer_profile` table

5. **Event Attachment**
   - `customer_raw_event.customer_profile_id` = `prof-001`

6. **Stream Publishing** (async)
   - Published to `events.raw` stream
   - Published to `events.normalized` stream

**Database State After Event 1**:
- `customer_profile`: 1 record (prof-001)
- `customer_raw_event`: 1 record (evt-001)
- `merge_history`: 0 records

---

#### Day 1, 2:30 PM - WhatsApp Message

**Event Source**: Twilio WhatsApp Webhook  
**Event Type**: `whatsapp_message`  
**Payload**:
```json
{
  "MessageSid": "SM123456789",
  "From": "whatsapp:+15550123",
  "To": "whatsapp:+15559999",
  "Body": "When will my order ship?",
  "MessageStatus": "received",
  "AccountSid": "ACxxxxx"
}
```

**What Happens**:

1. **Event Ingestion**
   - Raw event created: `evt-002`

2. **Identifier Extraction**
   - Extracted identifiers: `{ phone: "15550123", whatsapp: "+15550123" }`
   - Note: Phone extracted from WhatsApp number

3. **Profile Matching**
   - Searches for profiles with phone `15550123` or WhatsApp `+15550123`
   - **No direct match found** (different identifier type)
   - **Result**: New profile created

4. **Profile Creation**
   - Profile ID: `prof-002`
   - Profile Strength: 40% (only phone/WhatsApp identifiers)
   - Lifetime Value: $0.00
   - Total Orders: 0

5. **Event Attachment**
   - `customer_raw_event.customer_profile_id` = `prof-002`

6. **Profile Merge Detection** (after event attachment)
   - System checks: Do these profiles belong to the same person?
   - **Manual check needed**: Email vs Phone - no automatic match
   - **However**: If phone number matches email domain pattern, or if we have additional matching logic...

**Wait - Let's assume the system has additional matching logic or admin manually identifies these as the same customer. For this scenario, let's show what happens when a merge is triggered:**

7. **Profile Merge Triggered** (via admin action or advanced matching)
   - Profiles to merge: `[prof-001, prof-002]`
   - Count: 2 profiles ≤ 3 (MAX_AUTO_MERGE_PROFILES)
   - **Auto-merge approved**

8. **Profile Merging** (`backend/src/services/merger/profileMerger.ts`)
   - Base profile: `prof-001` (higher profile strength, created first)
   - Merged profile: `prof-002`
   - Combined identifiers: `{ email: "sarah.johnson@email.com", phone: "15550123", whatsapp: "+15550123" }`
   - New Profile Strength: 75% (multiple identifier types)
   - Combined Lifetime Value: $89.99
   - Combined Total Orders: 1

9. **Event Re-attachment**
   - `evt-002.customer_profile_id` updated to `prof-001`

10. **Merge History Created**
    - Record in `merge_history` table
    - Before snapshot: Both profiles
    - After snapshot: Merged profile
    - Reason: "identifier_match"

**Database State After Event 2**:
- `customer_profile`: 1 record (prof-001, merged)
- `customer_raw_event`: 2 records (both attached to prof-001)
- `merge_history`: 1 record

---

#### Day 3, 11:00 AM - POS Store Visit & Purchase

**Event Source**: POS System API  
**Event Type**: `store_visit` + `purchase`  
**Payload**:
```json
{
  "store_id": "STORE-001",
  "store_name": "Downtown Location",
  "loyalty_id": "LOY-789456",
  "phone": "+1-555-0123",
  "transaction_id": "TXN-98765",
  "total": 125.50,
  "items": [
    {
      "product_id": "PROD-002",
      "product_name": "Premium Sneakers",
      "category": "Footwear",
      "price": "125.50",
      "quantity": 1
    }
  ],
  "check_in_at": "2024-01-17T11:00:00Z",
  "check_out_at": "2024-01-17T11:45:00Z",
  "detection_method": "qr_scan"
}
```

**What Happens**:

1. **Store Visit Event Ingestion**
   - Event: `store_visit`
   - Event ID: `evt-003`

2. **Identifier Extraction**
   - Extracted: `{ phone: "15550123", loyalty_id: "LOY-789456" }`

3. **Profile Matching**
   - Finds `prof-001` (matches phone `15550123`)
   - **Result**: Event attached to existing profile

4. **Store Visit Record Created**
   - Record in `store_visit` table
   - Linked to `prof-001`
   - Duration: 45 minutes

5. **Purchase Event Ingestion**
   - Event: `purchase`
   - Event ID: `evt-004`

6. **Profile Update**
   - Lifetime Value: $89.99 + $125.50 = $215.49
   - Total Orders: 1 + 1 = 2
   - Profile Strength: 75% → 85% (loyalty_id added to identifiers)

7. **Product Intent Tracking**
   - Product intent created for "Premium Sneakers"
   - Intent score calculated based on purchase
   - Record in `product_intent` table

**Database State After Event 3**:
- `customer_profile`: 1 record (prof-001, updated)
- `customer_raw_event`: 4 records
- `store_visit`: 1 record
- `product_intent`: 1 record

---

#### Day 5, 3:00 PM - Cart Abandonment

**Event Source**: Shopify Frontend Tracking  
**Event Type**: `cart_add`  
**Payload**:
```json
{
  "product_id": "PROD-003",
  "product_name": "Premium Sneakers",
  "category": "Footwear",
  "price": "125.50",
  "session_id": "sess-abc123",
  "page_url": "https://store.com/products/premium-sneakers",
  "timestamp": "2024-01-19T15:00:00Z"
}
```

**What Happens**:

1. **Event Ingestion**
   - Event: `cart_add`
   - Event ID: `evt-005`
   - Attached to `prof-001` (via session/cookie matching or email)

2. **Product Intent Created**
   - High intent score: 85% (customer previously purchased this product)
   - Status: "active"
   - Record in `product_intent` table

3. **Cart Abandonment Detection** (after 2 hours)
   - System checks: Cart added but no purchase after 2 hours
   - **Automation Trigger**: Cart abandonment automation evaluates

4. **Automation Evaluation** (`backend/src/services/automation/automationService.ts`)
   - Automation: "Cart Abandonment Recovery"
   - Trigger type: `cart_abandonment`
   - Condition: Cart added > 2 hours ago, no purchase
   - **Result**: Automation should trigger

5. **Automation Execution** (`backend/src/services/automation/automationService.ts`)
   - Action: Send WhatsApp message with discount code
   - Execution record created in `automation_execution` table
   - Status: "triggered" → "executed"
   - WhatsApp message sent via Twilio

6. **Campaign Execution Record**
   - Record in `campaign_execution` table
   - Channel: "whatsapp"
   - Status: "sent"

**Database State After Event 4**:
- `customer_raw_event`: 5 records
- `product_intent`: 2 records (1 active)
- `automation_execution`: 1 record
- `campaign_execution`: 1 record

---

#### Day 6 - ML Predictions Update

**Trigger**: Scheduled feature build and prediction update

**What Happens**:

1. **Feature Calculation** (`services/ml_service/train/feature_builder.py`)
   - RFM Features:
     - Recency: 1 day (last purchase)
     - Frequency: 2 purchases
     - Monetary: $215.49
   - Profile Strength: 85%
   - Category Affinity: { "Apparel": 1, "Footwear": 1 }
   - Features stored in `features` table

2. **ML Prediction Request** (`services/ml_service/api/main.py`)
   - Churn Model: Input features → Prediction
   - LTV Model: Input features → Prediction
   - Segmentation Model: Input features → Cluster assignment

3. **Predictions Generated**:
   - Churn Score: 0.15 (15% - low risk, active customer)
   - Predicted LTV: $450.00
   - Segment: "loyal_customer"
   - Recommendations: ["Premium Sneakers", "Summer Collection T-Shirt"]

4. **Predictions Stored**
   - Record in `predictions` table
   - Linked to `prof-001`
   - Model version tracked

5. **Journey Update**
   - Current Stage: "retention" (active, repeat customer)
   - Journey Score: 78/100
   - Next Best Action: "Send personalized product recommendations"
   - Record in `customer_journey` table

**Database State After ML Update**:
- `features`: Multiple records (RFM, category affinity, etc.)
- `predictions`: 1 record
- `customer_journey`: 1 record (updated)

---

### Final State Summary

**Unified Profile** (`prof-001`):
- **Identifiers**: 
  - Email: sarah.johnson@email.com
  - Phone: +1-555-0123
  - WhatsApp: +1-555-0123
  - Loyalty ID: LOY-789456
- **Profile Strength**: 85%
- **Lifetime Value**: $215.49
- **Total Orders**: 2
- **Merged Profiles**: 2 (prof-002 was merged into prof-001)

**Events**: 5 total events
- 2 purchases
- 1 WhatsApp message
- 1 store visit
- 1 cart add

**ML Predictions**:
- Churn Risk: 15% (low)
- Predicted LTV: $450.00
- Segment: "loyal_customer"
- Recommendations: 2 products

**Automations**:
- 1 automation executed (cart abandonment recovery)

**Journey**:
- Stage: "retention"
- Score: 78/100
- Next Action: Personalized recommendations

---

## Scenario 2: High-Value Customer Identification

### Customer Profile
- **Name**: Michael Chen
- **Email**: michael.chen@email.com
- **Phone**: +1-555-0456
- **Initial State**: Existing customer with purchase history

### Timeline of Events

#### Week 1 - Multiple Shopify Purchases

**Events**: 5 separate purchase events over 7 days

**Purchase 1** (Day 1):
```json
{
  "email": "michael.chen@email.com",
  "total_spent": "199.99",
  "items": [{"product_name": "Designer Jacket", "category": "Apparel", "price": "199.99"}]
}
```

**Purchase 2** (Day 3):
```json
{
  "email": "michael.chen@email.com",
  "total_spent": "89.99",
  "items": [{"product_name": "Summer T-Shirt", "category": "Apparel", "price": "89.99"}]
}
```

**Purchase 3-5**: Similar structure, totaling $450.00

**What Happens**:

1. **Profile Updates** (after each purchase)
   - Lifetime Value increases: $0 → $199.99 → $289.98 → $450.00
   - Total Orders: 0 → 1 → 2 → 3 → 4 → 5
   - Profile Strength: 40% → 50% → 60% → 70% → 75% → 80%

2. **Feature Recalculation** (after 5th purchase)
   - RFM Features:
     - Recency: 1 day
     - Frequency: 5 purchases
     - Monetary: $450.00
   - Category Affinity: { "Apparel": 5 }

3. **ML Predictions Update**
   - Churn Score: 0.08 (8% - very low)
   - Predicted LTV: $1,200.00 (high value customer)
   - Segment: "champion" (high frequency, high monetary value)
   - Recommendations: Premium products in Apparel category

4. **Segment-Based Automation Trigger**
   - Automation: "VIP Customer Treatment"
   - Trigger: Segment = "champion"
   - Action: Send personalized email with exclusive offers
   - Execution record created

**Final State**:
- Lifetime Value: $450.00
- Total Orders: 5
- Profile Strength: 80%
- Segment: "champion"
- Predicted LTV: $1,200.00
- Automation Executions: 1

---

## Scenario 3: Churn Risk Detection & Retention

### Customer Profile
- **Name**: Emma Williams
- **Email**: emma.williams@email.com
- **Phone**: +1-555-0789
- **Initial State**: Customer with historical purchases

### Timeline

#### Historical Data (Last 90 Days)
- **Purchase 1**: 90 days ago - $150.00
- **Purchase 2**: 60 days ago - $75.00
- **Purchase 3**: 45 days ago - $100.00
- **Last Activity**: 45 days ago

#### Day 45 - Feature Calculation & ML Prediction

**What Happens**:

1. **RFM Feature Calculation**
   - Recency: 45 days (low - last purchase was 45 days ago)
   - Frequency: 3 purchases (medium)
   - Monetary: $325.00 (medium-high)

2. **ML Churn Prediction**
   - Input: Low recency, medium frequency, medium monetary
   - Churn Model Output: 0.75 (75% churn risk)
   - **Segment**: "at_risk" (high churn probability)

3. **Predictions Stored**
   - Churn Score: 0.75
   - Predicted LTV: $350.00 (decreasing)
   - Segment: "at_risk"

4. **Automation Trigger**
   - Automation: "Churn Risk Retention Campaign"
   - Trigger: Churn score ≥ 0.70
   - Condition: Segment = "at_risk"
   - **Result**: Automation triggers

5. **Automation Execution**
   - Action: Send WhatsApp message with special offer
   - Message: "Hi Emma! We miss you. Here's 20% off your next purchase: SAVE20"
   - Execution record created
   - Campaign execution record created

#### Day 47 - Customer Re-engagement

**Event**: Customer clicks link in WhatsApp message and makes purchase

**Purchase Event**:
```json
{
  "email": "emma.williams@email.com",
  "total_spent": "120.00",
  "items": [{"product_name": "New Collection Dress", "price": "120.00"}]
}
```

**What Happens**:

1. **Profile Update**
   - Lifetime Value: $325.00 → $445.00
   - Total Orders: 3 → 4
   - Last Activity: Updated to current date

2. **Feature Recalculation**
   - Recency: 45 days → 0 days (just purchased)
   - Frequency: 3 → 4
   - Monetary: $325.00 → $445.00

3. **ML Prediction Update**
   - Churn Score: 0.75 → 0.25 (decreased significantly)
   - Predicted LTV: $350.00 → $600.00 (increased)
   - Segment: "at_risk" → "loyal" (improved)

4. **Journey Update**
   - Previous Stage: "at_risk"
   - Current Stage: "retention"
   - Journey Score: 45 → 72 (improved)

**Final State**:
- Lifetime Value: $445.00
- Churn Risk: 25% (down from 75%)
- Segment: "loyal"
- Automation Executions: 1 (successful retention)

---

## Scenario 4: Profile Merge with Manual Review

### Customer Profile
- **Multiple Identifiers Across Channels**
- **Initial State**: 5 separate profiles created from different channels

### Profiles Created

**Profile 1** (Shopify - Email):
- Email: customer@example.com
- Profile ID: prof-101
- Lifetime Value: $200.00

**Profile 2** (WhatsApp - Phone):
- Phone: +1-555-1111
- WhatsApp: +1-555-1111
- Profile ID: prof-102
- Lifetime Value: $0.00

**Profile 3** (POS - Loyalty ID):
- Loyalty ID: LOY-1111
- Phone: +1-555-1111
- Profile ID: prof-103
- Lifetime Value: $150.00

**Profile 4** (Website - Cookie):
- Cookie ID: cookie-abc123
- Email: customer@example.com
- Profile ID: prof-104
- Lifetime Value: $50.00

**Profile 5** (Mobile App - Device ID):
- Device ID: device-xyz789
- Email: customer@example.com
- Profile ID: prof-105
- Lifetime Value: $75.00

### Merge Detection

**New Event Arrives**:
```json
{
  "email": "customer@example.com",
  "phone": "+1-555-1111",
  "loyalty_id": "LOY-1111"
}
```

**What Happens**:

1. **Identifier Extraction**
   - Email: customer@example.com
   - Phone: +1-555-1111
   - Loyalty ID: LOY-1111

2. **Profile Matching**
   - Finds profiles matching email: prof-101, prof-104, prof-105
   - Finds profiles matching phone: prof-102, prof-103
   - **Total matching profiles**: 5

3. **Merge Decision** (`backend/src/services/merger/profileMerger.ts`)
   - Count: 5 profiles
   - MAX_AUTO_MERGE_PROFILES: 3
   - **5 > 3**: Exceeds auto-merge limit
   - **Result**: Manual review required

4. **Manual Merge Queue Entry**
   - Record created in `manual_merge_queue` table
   - Profile IDs: [prof-101, prof-102, prof-103, prof-104, prof-105]
   - Status: "pending"
   - Reason: "Auto-merge blocked: 5 profiles exceed threshold of 3"

5. **Admin Review**
   - Admin views merge queue
   - Reviews profiles and identifiers
   - Confirms all 5 profiles belong to same customer
   - **Action**: Approve merge

6. **Manual Merge Execution**
   - Base profile: prof-101 (highest profile strength, oldest)
   - Merged profiles: prof-102, prof-103, prof-104, prof-105
   - Combined identifiers: All unique identifiers merged
   - Combined Lifetime Value: $200 + $0 + $150 + $50 + $75 = $475.00
   - Combined Total Orders: Sum of all orders
   - New Profile Strength: 95% (many identifier types)

7. **Merge History**
   - Record in `merge_history` table
   - Before snapshot: All 5 profiles
   - After snapshot: Merged profile
   - Reason: "manual_review"

8. **Event Re-attachment**
   - All events from merged profiles attached to prof-101

**Final State**:
- `customer_profile`: 1 record (prof-101, merged)
- `manual_merge_queue`: 1 record (status: "merged")
- `merge_history`: 1 record
- Combined Lifetime Value: $475.00
- Profile Strength: 95%

---

## How to Test These Scenarios

### Prerequisites

1. **Database Setup**
   ```bash
   cd backend
   npx prisma migrate dev
   ```

2. **Start Services**
   ```bash
   docker-compose -f infra/docker-compose.yml up -d
   ```

3. **Set Brand ID**
   ```bash
   export TEST_BRAND_ID="test-brand"
   ```

### Testing Scenario 1: Omnichannel Journey

**Step 1**: Create Shopify Purchase Event
```bash
curl -X POST http://localhost:3000/api/integrations/shopify/webhook \
  -H "Content-Type: application/json" \
  -H "x-brand-id: test-brand" \
  -H "x-shopify-topic: orders/create" \
  -d '{
    "id": 12345,
    "email": "sarah.johnson@email.com",
    "total_spent": "89.99",
    "items": [{"product_name": "Summer Collection T-Shirt", "price": "89.99"}]
  }'
```

**Step 2**: Send WhatsApp Message
```bash
curl -X POST http://localhost:3000/api/integrations/twilio/webhook \
  -H "Content-Type: application/json" \
  -H "x-brand-id: test-brand" \
  -d '{
    "From": "whatsapp:+15550123",
    "Body": "When will my order ship?",
    "MessageStatus": "received"
  }'
```

**Step 3**: Create POS Store Visit
```bash
curl -X POST http://localhost:3000/api/integrations/pos \
  -H "Content-Type: application/json" \
  -H "x-brand-id: test-brand" \
  -d '{
    "store_id": "STORE-001",
    "loyalty_id": "LOY-789456",
    "phone": "+1-555-0123",
    "total": 125.50,
    "check_in_at": "2024-01-17T11:00:00Z"
  }'
```

**Step 4**: Check Profile
```bash
curl http://localhost:3000/api/profiles \
  -H "x-brand-id: test-brand" | jq '.data[] | select(.identifiers.email == "sarah.johnson@email.com")'
```

**Step 5**: View Customer 360
```bash
# Get profile ID from step 4, then:
curl http://localhost:3000/api/profiles/{PROFILE_ID}/360 \
  -H "x-brand-id: test-brand" | jq
```

### Testing Scenario 2: High-Value Customer

**Generate Multiple Purchases**:
```bash
# Run the test data generator script (see generateRealWorldScenario.ts)
cd backend
tsx src/scripts/generateRealWorldScenario.ts --scenario high-value
```

### Testing Scenario 3: Churn Risk

**Generate Historical Data**:
```bash
tsx src/scripts/generateRealWorldScenario.ts --scenario churn-risk
```

### Testing Scenario 4: Manual Merge

**Generate Multiple Profiles**:
```bash
tsx src/scripts/generateRealWorldScenario.ts --scenario manual-merge
```

---

## Expected Database Changes

### After Scenario 1 (Omnichannel Journey)

**Tables Affected**:
- `customer_profile`: 1 record (merged)
- `customer_raw_event`: 5 records
- `store_visit`: 1 record
- `product_intent`: 2 records
- `merge_history`: 1 record
- `automation_execution`: 1 record
- `campaign_execution`: 1 record
- `predictions`: 1 record
- `features`: Multiple records
- `customer_journey`: 1 record

### Key Metrics to Verify

1. **Profile Merging**
   - Check `merge_history` table for merge records
   - Verify all events attached to single profile
   - Confirm identifiers are combined

2. **ML Predictions**
   - Check `predictions` table for churn, LTV, segment
   - Verify predictions are reasonable based on behavior

3. **Automations**
   - Check `automation_execution` for triggered automations
   - Verify actions were executed

4. **Journey Tracking**
   - Check `customer_journey` for stage progression
   - Verify journey score calculation

---

## Next Steps

1. **Run Test Scenarios**: Use the testing scripts to generate data
2. **Observe Results**: Check database and API responses
3. **Verify Predictions**: Ensure ML predictions are generated
4. **Test Automations**: Confirm automations trigger correctly
5. **Review Merges**: Check merge history and profile consolidation

---

**Status**: Ready for testing with real-world data scenarios

