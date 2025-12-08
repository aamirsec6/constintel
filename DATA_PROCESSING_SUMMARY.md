# Real-World Data Processing Summary

**Last Updated**: December 2024  
**Purpose**: Quick reference guide for how different data types are processed in ConstIntel

---

## Overview

This document provides a quick overview of how orders, transactions, and events are processed in ConstIntel, with real-world examples.

---

## Order & Transaction Processing

### How Orders Are Processed

1. **Order Arrives** → Webhook/API receives order data
2. **Event Ingestion** → `ingestEvent()` processes the order
3. **Identifier Extraction** → Email, phone, loyalty_id extracted
4. **Profile Matching** → Matches to existing customer profile
5. **Event Storage** → Order stored in `customer_raw_event` table
6. **Statistics Update** → Profile LTV and order count updated
7. **Stream Publishing** → Event published to Redis streams
8. **Downstream Processing** → ML predictions, automations triggered

### Example: Shopify Order

```json
Input:
{
  "id": 12345,
  "email": "customer@example.com",
  "total_spent": "89.99",
  "line_items": [...]
}

Processing:
1. Extract: { email: "customer@example.com" }
2. Match: Profile found (or create new)
3. Store: Event saved with profile_id
4. Update: Profile.lifetime_value += 89.99
5. Update: Profile.total_orders += 1
6. Publish: Stream event for ML/automation

Output:
- Updated customer profile
- New purchase event
- ML predictions updated
- Automations triggered (if applicable)
```

---

## Transaction Types

### 1. Shopify Orders (70% of orders)

**Event Type**: `purchase`  
**Source**: Shopify webhooks  
**Data Includes**:
- Order number, total, subtotal, tax, shipping
- Line items with products
- Payment method, fulfillment status
- Shipping/billing addresses

**Processing**:
- Standard event ingestion
- Profile statistics updated
- Journey stage progression

---

### 2. POS Transactions (30% of orders)

**Event Type**: `pos_sale` or `pos_transaction`  
**Source**: POS systems (Square, Clover, etc.)  
**Data Includes**:
- Transaction ID, store ID
- Customer identifiers (phone, loyalty_id)
- Items purchased
- Payment method

**Processing**:
- Event ingestion
- **Store visit detection** (if customer identified)
- **Product intent conversion** (mark purchased products)
- **In-store alerts** (if high-intent products)
- Profile statistics updated

---

## Data Flow Visualization

```
ORDER/TRANSACTION
      │
      ▼
┌─────────────────┐
│  Event Ingestion │  ← Extract identifiers
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Profile Matching│  ← Match or create profile
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Event Storage  │  ← Save to database
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Stats Update    │  ← Update LTV, order count
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Stream Publish  │  ← Publish to Redis
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Downstream      │  ← ML, Automations, Journey
└─────────────────┘
```

---

## Profile Statistics Calculation

### Lifetime Value (LTV)

**Formula**: Sum of all purchase event totals

```typescript
LTV = Σ(purchase_events.total_spent)
```

**Updated**: After each purchase event

### Total Orders

**Formula**: Count of purchase events

```typescript
Total Orders = COUNT(purchase_events)
```

**Updated**: After each purchase event

---

## Real-World Scenarios

### Scenario 1: First Purchase

**Customer**: New customer, no existing profile  
**Order**: $89.99 Shopify order

**What Happens**:
1. ✅ New profile created
2. ✅ Profile strength: 40% (email only)
3. ✅ LTV: $89.99
4. ✅ Total Orders: 1
5. ✅ Welcome automation triggered
6. ✅ ML segment: "new"

---

### Scenario 2: Returning Customer

**Customer**: Existing profile  
**Order**: $150.00 Shopify order

**What Happens**:
1. ✅ Profile matched by email
2. ✅ Event attached to existing profile
3. ✅ LTV: Previous + $150.00
4. ✅ Total Orders: Previous + 1
5. ✅ ML predictions updated
6. ✅ Upsell automation triggered

---

### Scenario 3: Multi-Channel Purchase

**Customer**: Has Shopify profile (email)  
**Transaction**: POS purchase (phone + loyalty_id)

**What Happens**:
1. ✅ POS event ingested
2. ✅ Profile matched by phone (same profile)
3. ✅ **Identifiers merged**: email + phone + loyalty_id
4. ✅ Profile strength: 40% → 85%
5. ✅ LTV updated
6. ✅ **Store visit detected** and linked
7. ✅ **Product intents converted**

---

## Order Data Structure

### Shopify Order Payload

```json
{
  "id": 12345,
  "order_number": "ORD-12345",
  "email": "customer@example.com",
  "phone": "+1-555-0123",
  "total_spent": "89.99",
  "subtotal": "83.32",
  "tax": "6.67",
  "shipping": "0.00",
  "currency": "USD",
  "financial_status": "paid",
  "fulfillment_status": "shipped",
  "payment_method": "credit_card",
  "line_items": [
    {
      "product_id": "PROD-001",
      "product_name": "T-Shirt",
      "quantity": 2,
      "price": "29.99",
      "category": "Apparel"
    }
  ],
  "shipping_address": {...},
  "billing_address": {...},
  "created_at": "2024-12-07T10:00:00Z",
  "source": "shopify"
}
```

### POS Transaction Payload

```json
{
  "transaction_id": "TXN-98765",
  "store_id": "STORE-001",
  "store_name": "Downtown Location",
  "phone": "+1-555-0123",
  "loyalty_id": "LOY-789456",
  "total": 125.50,
  "subtotal": 116.20,
  "tax": 9.30,
  "payment_method": "credit_card",
  "items": [
    {
      "product_id": "PROD-002",
      "product_name": "Sneakers",
      "quantity": 1,
      "price": "125.50",
      "category": "Footwear"
    }
  ],
  "timestamp": "2024-12-07T14:30:00Z",
  "pos_system": "square",
  "receipt_number": "RCP-98765"
}
```

---

## Processing Time

### Typical Processing Time

- **Event Ingestion**: < 100ms
- **Profile Matching**: < 50ms
- **Statistics Update**: < 50ms
- **Stream Publishing**: Async (non-blocking)
- **Total**: < 200ms per order

### Batch Processing

For bulk imports:
- Process in batches of 100
- Use transactions for consistency
- Update statistics after batch

---

## Error Handling

### Missing Identifiers

**Scenario**: Order has no email/phone  
**Handling**: 
- Event still stored
- Profile not created
- Event remains unattached
- Can be manually linked later

### Duplicate Orders

**Scenario**: Same order ingested twice  
**Handling**:
- Both events stored
- LTV may be double-counted
- Need deduplication logic (future enhancement)

### Profile Merge Conflicts

**Scenario**: >3 profiles match  
**Handling**:
- Queued for manual review
- Events attached to first match
- Admin can approve merge

---

## Testing

### Generate Test Orders

```bash
# Generate 500 orders
cd backend
npm run generate-orders -- --orders=500 --days=90

# Verify data
npm run generate-orders -- --orders=100 --days=30
```

### Check Results

```sql
-- Top customers by LTV
SELECT 
  identifiers->>'email' as email,
  lifetime_value,
  total_orders
FROM customer_profile
WHERE brand_id = 'your-brand-id'
ORDER BY lifetime_value DESC
LIMIT 10;
```

---

## Related Files

- **Order Generator**: `backend/src/scripts/generateOrdersAndTransactions.ts`
- **Statistics Service**: `backend/src/services/profile/profileStatisticsService.ts`
- **Event Ingestion**: `backend/src/services/ingestion/eventIngestion.ts`
- **POS Processing**: `backend/src/services/integrations/pos.ts`
- **Shopify Processing**: `backend/src/services/integrations/shopify.ts`

---

## Quick Reference

| Data Type | Event Type | Source | Processing |
|-----------|-----------|--------|------------|
| Shopify Order | `purchase` | Webhook | Standard ingestion |
| POS Transaction | `pos_sale` | POS System | + Store visit + Intent conversion |
| WooCommerce Order | `purchase` | Webhook | Standard ingestion |
| Manual Order | `purchase` | API/CSV | Standard ingestion |

---

## Next Steps

1. ✅ Run order generator: `npm run generate-orders`
2. ✅ Verify profiles have updated statistics
3. ✅ Check dashboards show revenue data
4. ✅ Test automations trigger on orders

