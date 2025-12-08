# What We Are Building - ConstIntel Platform Explained

**Last Updated**: December 2024

---

## 🎯 The Big Picture

**ConstIntel** is a **Unified Commerce Intelligence Platform** - think of it as the "customer brain" for retail and D2C brands.

### The Core Problem We're Solving

When a customer interacts with your brand, they leave traces across multiple channels:
- **Online**: Website visits, product views, cart additions, purchases
- **Offline**: Store visits, POS purchases, QR code scans
- **Messaging**: WhatsApp conversations, email opens, SMS clicks
- **Devices**: Different browsers, mobile apps, tablets

**The Challenge**: These interactions are fragmented. A customer might:
1. Browse products on your website (cookie_id: `abc123`)
2. Add items to cart on mobile (device_id: `xyz789`)
3. Visit your store and make a purchase (phone: `+1234567890`)
4. Message you on WhatsApp (whatsapp: `+1234567890`)

**Without ConstIntel**: You see 4 different "customers"  
**With ConstIntel**: You see 1 unified customer profile with their complete journey

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    REAL WORLD SCENARIO                        │
│                                                               │
│  Customer "Sarah" interacts with your brand:                  │
│                                                               │
│  1. Visits website → cookie_id: "cookie_abc"                  │
│  2. Browses products → device_id: "device_xyz"               │
│  3. Adds to cart → email: "sarah@email.com"                  │
│  4. Visits store → phone: "+1234567890"                      │
│  5. Makes purchase → loyalty_id: "LOY-12345"                 │
│  6. Messages WhatsApp → whatsapp: "+1234567890"              │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              CONSTINTEL IDENTITY RESOLUTION ENGINE            │
│                                                               │
│  Step 1: Extract Identifiers from Each Event                 │
│    - Event 1: { cookie_id: "cookie_abc" }                    │
│    - Event 2: { device_id: "device_xyz" }                    │
│    - Event 3: { email: "sarah@email.com" }                  │
│    - Event 4: { phone: "+1234567890" }                       │
│    - Event 5: { loyalty_id: "LOY-12345" }                    │
│    - Event 6: { whatsapp: "+1234567890" }                    │
│                                                               │
│  Step 2: Match to Existing Profiles                          │
│    - Find profiles with matching identifiers                 │
│    - Priority: phone/email > loyalty > device > cookie      │
│                                                               │
│  Step 3: Merge Profiles (if multiple matches)                 │
│    - Auto-merge if ≤ 3 profiles match                         │
│    - Manual review if > 3 profiles match                       │
│                                                               │
│  Step 4: Create Unified Profile                              │
│    {                                                          │
│      id: "profile-uuid",                                     │
│      identifiers: {                                          │
│        email: "sarah@email.com",                              │
│        phone: "+1234567890",                                 │
│        loyalty_id: "LOY-12345",                              │
│        device_id: "device_xyz",                               │
│        cookie_id: "cookie_abc",                               │
│        whatsapp: "+1234567890"                                │
│      },                                                       │
│      profileStrength: 95,  // High confidence                │
│      lifetimeValue: 1250.50,                                  │
│      totalOrders: 12                                          │
│    }                                                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    CUSTOMER 360 VIEW                          │
│                                                               │
│  This is what the Customer 360 page should show:              │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ PROFILE OVERVIEW                                      │    │
│  │ - Profile ID, Strength, LTV, Total Orders            │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ IDENTIFIERS (Omnichannel Tracking)                    │    │
│  │ ✓ Email: sarah@email.com                             │    │
│  │ ✓ Phone: +1234567890                                 │    │
│  │ ✓ Loyalty ID: LOY-12345                              │    │
│  │ ✓ Device ID: device_xyz                              │    │
│  │ ✓ Cookie ID: cookie_abc                               │    │
│  │ ✓ WhatsApp: +1234567890                              │    │
│  │                                                       │    │
│  │ This shows HOW we track the customer across channels │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ ML PREDICTIONS                                         │    │
│  │ - Churn Risk: 15% (Low)                              │    │
│  │ - Predicted LTV: $2,500                               │    │
│  │ - Segment: "Champion"                                 │    │
│  │ - Recommendations: [Product A, Product B]            │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ OMNICHANNEL JOURNEY                                    │    │
│  │                                                         │    │
│  │ Timeline of interactions across channels:               │    │
│  │                                                         │    │
│  │ 📱 Website (cookie_abc)                                │    │
│  │    └─> Product View: "Summer Dress"                    │    │
│  │                                                         │    │
│  │ 📱 Mobile App (device_xyz)                              │    │
│  │    └─> Cart Add: "Summer Dress"                        │    │
│  │                                                         │    │
│  │ 🏪 Store Visit (phone: +1234567890)                    │    │
│  │    └─> Purchase: "Summer Dress" ($89.99)              │    │
│  │                                                         │    │
│  │ 💬 WhatsApp (whatsapp: +1234567890)                     │    │
│  │    └─> Message: "Thank you for your purchase!"         │    │
│  │                                                         │    │
│  │ This shows the COMPLETE customer journey                │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ CHANNEL STATISTICS                                    │    │
│  │ - Preferred Channel: WhatsApp                        │    │
│  │ - Total Purchases: 12                                │    │
│  │ - Online Purchases: 8                                 │    │
│  │ - Store Purchases: 4                                 │    │
│  │ - WhatsApp Conversations: 15                         │    │
│  │                                                       │    │
│  │ This shows WHERE the customer engages                 │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ PRODUCT INTENTS                                        │    │
│  │ - High-intent products the customer is interested in  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ STORE VISITS                                          │    │
│  │ - Physical store visits with timestamps               │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 What Data We Collect

### 1. Identifiers (How We Track Customers)

**Purpose**: These are the "fingerprints" that help us identify the same customer across different channels.

| Identifier | Priority | Example | Use Case |
|------------|----------|---------|----------|
| **Phone** | Highest | `+1234567890` | POS purchases, WhatsApp, SMS |
| **Email** | Highest | `customer@email.com` | Online purchases, email campaigns |
| **Loyalty ID** | High | `LOY-12345` | Store purchases, loyalty program |
| **Device ID** | Medium | `device_abc123` | Mobile app, app-based purchases |
| **Cookie ID** | Low | `cookie_xyz789` | Website browsing, anonymous tracking |
| **WhatsApp** | High | `+1234567890` | WhatsApp conversations |
| **QR ID** | Medium | `qr_scan_123` | QR code scans in store |
| **Card Last 4** | Low | `1234` | Payment method matching |

**Why Multiple Identifiers Matter**:
- A customer might browse anonymously (cookie_id only)
- Then make a purchase with email (email + cookie_id)
- Then visit store with phone (phone + email = same customer!)
- ConstIntel merges all these into one profile

### 2. Events (What Customers Do)

**Event Types We Track**:
- `page_view` - Website page views
- `product_view` - Product detail page views
- `cart_add` - Items added to cart
- `cart_abandon` - Cart abandoned
- `purchase` - Online purchase
- `pos_transaction` - In-store purchase
- `whatsapp_message` - WhatsApp conversation
- `store_visit` - Physical store visit
- `qr_scan` - QR code scan

**Each Event Contains**:
- Event type
- Timestamp
- Payload (product details, amounts, etc.)
- Identifiers (extracted automatically)

### 3. ML Predictions (What Customers Will Do)

**Predictions Generated**:
- **Churn Risk** (0-100%): Likelihood customer will stop engaging
- **Predicted LTV**: Expected lifetime value
- **Segment**: Customer segment (Champion, Loyal, At-Risk, New, Potential)
- **Recommendations**: Product recommendations based on behavior

**How Predictions Work**:
1. Events are collected → Features are calculated (RFM, category affinity, etc.)
2. Features are sent to ML service → Predictions are generated
3. Predictions are stored in `predictions` table
4. Customer 360 page displays predictions

---

## 🔍 What Customer 360 Should Show

### Current State (What's Working)
✅ Profile Overview (ID, Strength, LTV, Orders)  
✅ Basic Identifiers display (email, phone, loyalty_id)  
✅ Product Intents section  
✅ Store Visits section  
✅ Campaign History section  

### Missing (What Should Be There)

#### 1. **Complete Identifiers Display**
**Problem**: Only showing email, phone, loyalty_id  
**Should Show**: 
- Device ID
- Cookie ID
- WhatsApp number
- QR ID
- Card last 4
- All identifiers that were collected

**Why This Matters**: Shows HOW we're tracking the customer across channels

#### 2. **ML Predictions**
**Problem**: Predictions are not showing  
**Should Show**:
- Churn Risk score with visual indicator
- Predicted LTV
- Customer Segment (Champion, Loyal, At-Risk, etc.)
- Product Recommendations

**Why This Matters**: Shows WHAT the customer is likely to do next

#### 3. **Omnichannel Journey/Timeline**
**Problem**: No timeline view of cross-channel interactions  
**Should Show**:
- Chronological timeline of all events
- Channel attribution (which channel led to purchase)
- Visual representation of journey across channels
- Statistics: preferred channel, channel breakdown

**Why This Matters**: Shows the COMPLETE customer journey across all touchpoints

#### 4. **Channel Statistics**
**Problem**: Statistics are calculated but not displayed  
**Should Show**:
- Total purchases by channel (Online vs Store)
- Preferred channel
- Channel breakdown (Website: 40%, Store: 35%, WhatsApp: 25%)
- Category affinity by channel

**Why This Matters**: Shows WHERE the customer engages most

---

## 🔧 Why Data Is Missing

### Issue 1: Identifiers Not Being Stored
**Root Cause**: 
- Mock data generator creates events with identifiers in payload
- But identifiers are not being extracted and stored in `customer_profile.identifiers`
- The `extractIdentifiers()` function exists but may not be called properly during event ingestion

**Fix Needed**:
- Ensure `extractIdentifiers()` is called for all events
- Update profile identifiers when new identifiers are found
- Regenerate mock data with proper identifier extraction

### Issue 2: ML Predictions Not Generated
**Root Cause**:
- ML prediction generation script exists but may not have run
- Or predictions were generated but not linked to profiles
- Or predictions table is empty

**Fix Needed**:
- Verify ML prediction generation script
- Ensure predictions are linked to profiles
- Regenerate predictions for all profiles

### Issue 3: Omnichannel Data Not Displayed
**Root Cause**:
- Backend service (`customer360Service.ts`) calculates statistics
- But frontend doesn't display the `statistics` object
- Timeline view is not implemented in frontend

**Fix Needed**:
- Add statistics display section to Customer 360 page
- Implement timeline view showing events across channels
- Add channel breakdown visualization

---

## 🎯 What We Need to Build

### Priority 1: Fix Data Collection
1. **Fix Identifier Extraction**
   - Ensure all events extract identifiers properly
   - Update profiles when new identifiers are found
   - Regenerate mock data with complete identifiers

2. **Fix ML Predictions**
   - Verify prediction generation
   - Ensure predictions are linked to profiles
   - Regenerate predictions for all profiles

### Priority 2: Enhance Customer 360 Display
1. **Complete Identifiers Section**
   - Show ALL identifier types (device_id, cookie_id, etc.)
   - Visual indicator of identifier confidence

2. **ML Predictions Display**
   - Churn risk with color-coded indicator
   - Predicted LTV
   - Segment badge
   - Recommendations list

3. **Omnichannel Journey Timeline**
   - Chronological event timeline
   - Channel icons/colors
   - Event details on hover
   - Filter by channel

4. **Channel Statistics**
   - Channel breakdown chart
   - Preferred channel indicator
   - Purchase distribution by channel
   - Category affinity by channel

---

## 📈 Real-World Example

**Scenario**: Customer "John" interacts with your brand

**What Happens**:
1. John visits website → Creates profile with `cookie_id: "abc123"`
2. John adds to cart → Profile updated with `device_id: "xyz789"`
3. John makes purchase → Profile updated with `email: "john@email.com"`
4. John visits store → Profile matched via phone, merged with existing profile
5. John messages WhatsApp → Profile matched via phone, all events linked

**Customer 360 Should Show**:
- **Identifiers**: cookie_id, device_id, email, phone, whatsapp
- **Journey**: Website → Cart → Purchase → Store Visit → WhatsApp
- **ML Predictions**: Low churn (15%), High LTV ($2,500), Segment: Champion
- **Statistics**: Preferred channel: WhatsApp, 60% online, 40% store

**This is the "360 view"** - seeing the complete customer across all channels in one place.

---

## 🚀 Next Steps

1. **Understand the System**: This document explains what we're building
2. **Fix Data Collection**: Ensure identifiers and predictions are properly stored
3. **Enhance Display**: Show all the omnichannel data in Customer 360 page
4. **Test with Real Data**: Verify the complete flow works end-to-end

---

## 💡 Key Takeaways

1. **ConstIntel = Identity Resolution + ML Predictions + Omnichannel Tracking**
2. **Customer 360 = Unified view showing WHO, WHAT, WHERE, WHEN, WHY**
3. **Identifiers = How we track customers across channels**
4. **ML Predictions = What customers will likely do next**
5. **Omnichannel = Complete journey across all touchpoints**

The goal is to give brands a **complete picture** of each customer so they can:
- Personalize experiences
- Predict behavior
- Prevent churn
- Increase LTV
- Run smart automations

