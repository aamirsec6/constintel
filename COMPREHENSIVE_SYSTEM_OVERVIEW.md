# ConstIntel - Comprehensive System Overview

**Last Updated**: December 2024  
**Version**: Production-Ready Platform

---

## Table of Contents

1. [Platform Overview](#platform-overview)
2. [System Capabilities & Features](#system-capabilities--features)
3. [Database Schema](#database-schema)
4. [Folder Structure](#folder-structure)
5. [System Design & Architecture](#system-design--architecture)
6. [How It Works](#how-it-works)
7. [API Endpoints](#api-endpoints)
8. [Tech Stack](#tech-stack)

---

## Platform Overview

**ConstIntel** is a **production-ready Unified Commerce Intelligence Platform** — the "customer brain" for retail & D2C brands.

### Core Mission

👉 Build **ONE unified view** of the customer across all channels  
👉 Understand **who the customer is**, **what they want**, and **what they are likely to do next**  
👉 Provide **ML-based predictions and recommendations**  
👉 Enable brands to run **smart automations** based on real behavior  
👉 Give analysts a **clean Customer 360 dashboard**

### What This Platform IS

✅ **Omnichannel Intelligence Engine** that merges:
- Ecommerce events (views, carts, purchases)
- Offline POS purchases
- WhatsApp messages and interactions
- QR scans & store engagement
- Device identifiers (cookies, device_id)
- Loyalty/phone/email identifiers

---

## System Capabilities & Features

### 1. Event Ingestion & Processing

**Capabilities:**
- ✅ Real-time event ingestion from multiple channels
- ✅ Event normalization and validation
- ✅ Queue-based processing with Redis
- ✅ Idempotency handling (prevents duplicate processing)
- ✅ Event streaming with Redis Streams
- ✅ Batch processing support

**Supported Event Types:**
- Purchase events
- Page views
- Cart additions/abandonments
- WhatsApp messages
- Store visits
- Product views
- Search queries
- Custom events

### 2. Identity Resolution & Profile Merging

**Capabilities:**
- ✅ Automatic profile matching using multiple identifiers
- ✅ Smart merging algorithm (auto-merge up to 3 profiles)
- ✅ Manual review queue for complex merges
- ✅ Complete audit trail of all merges
- ✅ Profile strength scoring (0-100)
- ✅ Identifier priority system

**Identifier Priority:**
1. Phone / Email (highest confidence)
2. Loyalty ID
3. Device ID
4. Cookie ID (lowest confidence)

**Supported Identifiers:**
- Phone number
- Email address
- Loyalty ID
- WhatsApp number
- Device ID
- Cookie ID
- QR ID
- UPI ID
- Card last 4 digits

### 3. Customer 360 View

**Capabilities:**
- ✅ Unified customer profile across all channels
- ✅ Complete interaction history
- ✅ Lifetime value tracking
- ✅ Order history
- ✅ Product intent tracking
- ✅ Journey stage tracking
- ✅ Multi-touch attribution
- ✅ Real-time profile updates

**Data Included:**
- All identifiers
- Purchase history
- Browsing behavior
- Category affinity
- Channel preferences
- ML predictions
- Recommended products
- Journey stage

### 4. ML-Powered Predictions

**Capabilities:**
- ✅ Churn prediction (0-1 probability)
- ✅ Lifetime Value (LTV) prediction
- ✅ Customer segmentation
- ✅ Product recommendations
- ✅ Model versioning and tracking
- ✅ Feature engineering
- ✅ Batch and real-time inference

**ML Models:**
1. **Churn Prediction** (LightGBM)
   - Input: RFM features, profile strength
   - Output: Churn probability (0-1)
   - Metrics: Accuracy, Precision, Recall, F1, ROC-AUC

2. **LTV Prediction** (LightGBM)
   - Input: RFM features, profile strength
   - Output: Predicted lifetime value ($)
   - Metrics: RMSE, MAE, R², MAPE

3. **Segmentation** (KMeans)
   - Input: RFM features, profile strength
   - Output: Segment (champions, at_risk, new_customers, loyal)
   - Metrics: Silhouette Score, Inertia

### 5. Integrations

**Supported Integrations:**

1. **Shopify**
   - Webhook signature validation
   - Order events → purchase events
   - Customer events → profile updates
   - Product sync

2. **WooCommerce**
   - Webhook signature validation
   - Order events → purchase events
   - Customer events → profile updates

3. **Twilio WhatsApp**
   - Inbound messages → events
   - Outbound message sending
   - Status callbacks

4. **Generic POS**
   - CSV import
   - API ingestion
   - Custom payload mapping

5. **CSV Import**
   - Bulk event import
   - Delimiter selection
   - Event type mapping

6. **CRM Integration**
   - Salesforce
   - HubSpot
   - Generic REST API

### 6. Marketing Automation

**Capabilities:**
- ✅ Trigger-based automations
- ✅ Multi-channel actions (WhatsApp, Email, SMS)
- ✅ A/B testing support
- ✅ Priority-based execution
- ✅ Execution tracking
- ✅ Error handling and retries

**Trigger Types:**
- Churn risk threshold
- Event-based triggers
- Segment-based triggers
- Time-based triggers

**Action Types:**
- Send WhatsApp message
- Send email
- Send SMS
- Update customer segment
- Trigger campaign

### 7. Campaign Management

**Capabilities:**
- ✅ One-time campaigns
- ✅ Recurring campaigns
- ✅ Triggered campaigns
- ✅ Segment targeting
- ✅ Multi-channel delivery
- ✅ A/B testing
- ✅ Performance tracking
- ✅ Duplicate prevention

**Campaign Types:**
- One-time
- Recurring
- Triggered

**Channels:**
- WhatsApp
- Email
- SMS
- Push notifications

### 8. Analytics & Insights

**Capabilities:**
- ✅ Time series analytics
- ✅ Cohort analysis
- ✅ Funnel analysis
- ✅ Segment analytics
- ✅ Channel attribution
- ✅ Prediction analytics
- ✅ Anomaly detection
- ✅ Custom reports

**Analytics Types:**
- Revenue trends
- Customer acquisition
- Retention analysis
- Conversion funnels
- Channel performance
- ML prediction trends

### 9. Store & Inventory Management

**Capabilities:**
- ✅ Store visit tracking
- ✅ In-store alerts
- ✅ Inventory tracking
- ✅ Demand signals
- ✅ Trending products
- ✅ Store-level analytics

**Store Visit Detection:**
- Geofencing
- QR scan
- POS lookup
- Check-in
- WiFi detection

**Inventory Features:**
- Store-level inventory
- Demand scoring
- Reorder points
- Trending products

### 10. Product Intent Tracking

**Capabilities:**
- ✅ Product interest tracking
- ✅ Intent scoring (0-100)
- ✅ Multi-channel intent signals
- ✅ Conversion tracking
- ✅ Expiration handling

**Intent Signals:**
- Product views
- Search queries
- Cart additions
- Wishlist additions

### 11. Customer Journey Tracking

**Capabilities:**
- ✅ Journey stage tracking
- ✅ Touchpoint timeline
- ✅ Next best action recommendations
- ✅ Journey scoring
- ✅ Stage transition tracking

**Journey Stages:**
- Awareness
- Consideration
- Purchase
- Retention
- Advocacy

### 12. Multi-Touch Attribution

**Capabilities:**
- ✅ Multiple attribution models
- ✅ Channel credit allocation
- ✅ Conversion tracking
- ✅ Touchpoint analysis

**Attribution Models:**
- First touch
- Last touch
- Linear
- Time decay
- Position-based
- Data-driven

### 13. Admin & Brand Management

**Capabilities:**
- ✅ Multi-brand support
- ✅ User management
- ✅ Brand metrics tracking
- ✅ Instance provisioning
- ✅ Onboarding management
- ✅ API key management

**Brand Features:**
- Plan management (free, pro, enterprise)
- Status tracking
- Settings management
- Onboarding state
- Activity tracking

---

## Database Schema

### Core Tables

#### 1. **User** (`user`)
Platform users (admins and brand users)

**Fields:**
- `id` (UUID, Primary Key)
- `email` (String, Unique)
- `passwordHash` (String)
- `role` (String: "admin", "brand_owner", "brand_user")
- `brandId` (String, Foreign Key → Brand, Nullable)
- `emailVerified` (Boolean)
- `lastLogin` (DateTime, Nullable)
- `createdAt`, `updatedAt` (DateTime)

**Indexes:**
- `email`
- `brandId`
- `role`

#### 2. **Brand** (`brand`)
Brand/organization information

**Fields:**
- `id` (UUID, Primary Key)
- `name` (String)
- `domain` (String, Nullable)
- `industry` (String, Nullable)
- `plan` (String: "free", "pro", "enterprise")
- `status` (String: "active", "suspended", "trial")
- `instanceId` (String, Unique, Nullable)
- `instanceConfig` (JSON, Nullable)
- `settings` (JSON, Nullable)
- `apiKey` (String, Unique, Nullable)
- `onboardingState` (JSON, Nullable)
- `onboardingCompleted` (Boolean)
- `createdAt`, `updatedAt`, `lastActivityAt` (DateTime)

**Relations:**
- `users` (User[])
- `metrics` (BrandMetrics[])
- `metricsHistory` (BrandMetricsHistory[])

#### 3. **CustomerProfile** (`customer_profile`)
Unified customer profiles

**Fields:**
- `id` (UUID, Primary Key)
- `brandId` (String, Foreign Key → Brand)
- `identifiers` (JSON: phone, email, loyalty_id, etc.)
- `profileStrength` (Int: 0-100)
- `lifetimeValue` (Decimal)
- `totalOrders` (Int)
- `createdAt`, `updatedAt` (DateTime)

**Relations:**
- `rawEvents` (CustomerRawEvent[])
- `predictions` (Prediction?)
- `features` (Feature[])
- `mergeHistoryAsBase` (MergeHistory[])
- `mergeHistoryAsMerged` (MergeHistory[])
- `productIntents` (ProductIntent[])
- `storeVisits` (StoreVisit[])
- `inStoreAlerts` (InStoreAlert[])
- `automationExecutions` (AutomationExecution[])
- `campaignExecutions` (CampaignExecution[])
- `journey` (CustomerJourney?)
- `attributions` (Attribution[])

**Indexes:**
- `brandId`
- `profileStrength`

#### 4. **CustomerRawEvent** (`customer_raw_event`)
Raw event ingestion

**Fields:**
- `id` (UUID, Primary Key)
- `brandId` (String)
- `payload` (JSON)
- `eventType` (String)
- `customerProfileId` (String, Foreign Key → CustomerProfile, Nullable)
- `createdAt` (DateTime)

**Indexes:**
- `brandId`, `createdAt`
- `customerProfileId`
- `eventType`

#### 5. **Prediction** (`predictions`)
ML predictions cache

**Fields:**
- `profileId` (UUID, Primary Key, Foreign Key → CustomerProfile)
- `churnScore` (Float: 0-1)
- `ltvScore` (Float)
- `recommendations` (JSON)
- `segment` (String)
- `modelVersion` (String)
- `updatedAt` (DateTime)

#### 6. **Feature** (`features`)
Feature store

**Fields:**
- `id` (UUID, Primary Key)
- `profileId` (String, Foreign Key → CustomerProfile)
- `featureName` (String)
- `featureValue` (JSON)
- `updatedAt` (DateTime)

**Unique Constraint:**
- `profileId`, `featureName`

**Indexes:**
- `profileId`
- `featureName`

#### 7. **MergeHistory** (`merge_history`)
Profile merge audit log

**Fields:**
- `id` (UUID, Primary Key)
- `baseProfileId` (String, Foreign Key → CustomerProfile)
- `mergedProfileId` (String, Foreign Key → CustomerProfile)
- `reason` (String)
- `beforeSnapshot` (JSON, Nullable)
- `afterSnapshot` (JSON, Nullable)
- `createdAt` (DateTime)

**Indexes:**
- `baseProfileId`
- `mergedProfileId`

#### 8. **ManualMergeQueue** (`manual_merge_queue`)
Manual review queue

**Fields:**
- `id` (UUID, Primary Key)
- `profileIds` (JSON: Array of profile IDs)
- `reason` (String)
- `status` (String: "pending", "approved", "rejected", "merged")
- `createdAt`, `updatedAt` (DateTime)

**Indexes:**
- `status`

#### 9. **ModelVersion** (`model_version`)
ML model registry

**Fields:**
- `id` (UUID, Primary Key)
- `modelType` (String: "churn", "ltv", "segmentation")
- `version` (String)
- `modelPath` (String)
- `metrics` (JSON)
- `trainingDate` (DateTime)
- `isActive` (Boolean)
- `trainingSamples` (Int)
- `featureCount` (Int)
- `hyperparameters` (JSON, Nullable)
- `notes` (String, Nullable)
- `createdAt`, `updatedAt` (DateTime)

**Unique Constraint:**
- `modelType`, `version`

**Indexes:**
- `modelType`, `isActive`
- `trainingDate`

#### 10. **Product** (`product`)
Product catalog

**Fields:**
- `id` (UUID, Primary Key)
- `brandId` (String)
- `productId` (String, Unique)
- `name` (String)
- `description` (String, Nullable)
- `category` (String, Nullable)
- `subcategory` (String, Nullable)
- `price` (Decimal, Nullable)
- `currency` (String, Default: "USD")
- `metadata` (JSON, Nullable)
- `active` (Boolean, Default: true)
- `createdAt`, `updatedAt` (DateTime)

**Relations:**
- `inventory` (Inventory[])

**Indexes:**
- `brandId`, `category`
- `brandId`, `active`

#### 11. **Inventory** (`inventory`)
Store-level inventory tracking

**Fields:**
- `id` (UUID, Primary Key)
- `brandId` (String)
- `productId` (String, Foreign Key → Product)
- `storeId` (String)
- `storeName` (String, Nullable)
- `quantity` (Int)
- `reservedQuantity` (Int)
- `reorderPoint` (Int, Nullable)
- `maxStock` (Int, Nullable)
- `demandScore` (Float, Nullable)
- `trending` (Boolean, Default: false)
- `lastUpdated`, `createdAt`, `updatedAt` (DateTime)

**Unique Constraint:**
- `productId`, `storeId`

**Indexes:**
- `brandId`, `storeId`
- `brandId`, `trending`
- `demandScore`

#### 12. **ProductIntent** (`product_intent`)
Product interest tracking

**Fields:**
- `id` (UUID, Primary Key)
- `brandId` (String)
- `profileId` (String, Foreign Key → CustomerProfile)
- `productId` (String)
- `productName` (String, Nullable)
- `category` (String, Nullable)
- `intentType` (String: "view", "search", "cart_add", "wishlist")
- `intentScore` (Float: 0-100)
- `sourceChannel` (String)
- `sessionId` (String, Nullable)
- `pageUrl` (String, Nullable)
- `searchQuery` (String, Nullable)
- `viewDuration` (Int, Nullable)
- `status` (String: "active", "converted", "expired")
- `expiresAt` (DateTime, Nullable)
- `firstSeenAt`, `lastSeenAt`, `convertedAt` (DateTime)

**Indexes:**
- `brandId`, `profileId`, `status`
- `productId`, `status`
- `status`, `expiresAt`
- `profileId`, `status`, `lastSeenAt`

#### 13. **StoreVisit** (`store_visit`)
Physical store visit tracking

**Fields:**
- `id` (UUID, Primary Key)
- `brandId` (String)
- `profileId` (String, Foreign Key → CustomerProfile, Nullable)
- `storeId` (String)
- `storeName` (String, Nullable)
- `detectionMethod` (String: "geofence", "qr_scan", "pos_lookup", "checkin", "wifi")
- `location` (JSON, Nullable)
- `checkInAt` (DateTime)
- `checkOutAt` (DateTime, Nullable)
- `duration` (Int, Nullable)
- `status` (String: "active", "completed", "abandoned")
- `activeIntents` (JSON, Nullable)

**Relations:**
- `profile` (CustomerProfile?)
- `alerts` (InStoreAlert[])

**Indexes:**
- `brandId`, `profileId`, `checkInAt`
- `storeId`, `checkInAt`
- `status`, `checkInAt`

#### 14. **InStoreAlert** (`in_store_alert`)
In-store alerts for staff

**Fields:**
- `id` (UUID, Primary Key)
- `brandId` (String)
- `storeId` (String)
- `visitId` (String, Foreign Key → StoreVisit)
- `profileId` (String, Foreign Key → CustomerProfile)
- `alertType` (String: "product_intent", "high_value_customer", "churn_risk")
- `title` (String)
- `message` (String)
- `productIds` (JSON)
- `deliveryMethod` (String: "store_app", "sms", "whatsapp", "pos_screen")
- `deliveryStatus` (String: "pending", "delivered", "viewed", "dismissed")
- `createdAt`, `deliveredAt`, `viewedAt` (DateTime)

**Indexes:**
- `storeId`, `deliveryStatus`, `createdAt`
- `visitId`

#### 15. **MarketingAutomation** (`marketing_automation`)
Automation rules and triggers

**Fields:**
- `id` (UUID, Primary Key)
- `brandId` (String)
- `name` (String)
- `description` (String, Nullable)
- `trigger` (JSON)
- `conditions` (JSON, Nullable)
- `actions` (JSON)
- `enabled` (Boolean, Default: true)
- `priority` (Int, Default: 0)
- `abTestEnabled` (Boolean, Default: false)
- `abTestVariants` (JSON, Nullable)
- `createdAt`, `updatedAt` (DateTime)

**Relations:**
- `executions` (AutomationExecution[])

**Indexes:**
- `brandId`, `enabled`
- `brandId`, `priority`

#### 16. **AutomationExecution** (`automation_execution`)
Automation execution tracking

**Fields:**
- `id` (UUID, Primary Key)
- `automationId` (String, Foreign Key → MarketingAutomation)
- `profileId` (String, Foreign Key → CustomerProfile)
- `status` (String: "triggered", "executed", "failed", "skipped")
- `triggerReason` (String, Nullable)
- `actionsExecuted` (JSON, Nullable)
- `errorMessage` (String, Nullable)
- `triggeredAt` (DateTime)
- `executedAt` (DateTime, Nullable)

**Indexes:**
- `automationId`, `triggeredAt`
- `profileId`, `triggeredAt`

#### 17. **Campaign** (`campaign`)
Marketing campaign management

**Fields:**
- `id` (UUID, Primary Key)
- `brandId` (String)
- `name` (String)
- `description` (String, Nullable)
- `campaignType` (String: "one_time", "recurring", "triggered")
- `schedule` (JSON, Nullable)
- `targetSegment` (JSON, Nullable)
- `targetChannels` (JSON)
- `messageTemplate` (JSON)
- `personalization` (JSON, Nullable)
- `abTestEnabled` (Boolean, Default: false)
- `abTestVariants` (JSON, Nullable)
- `duplicatePrevention` (Boolean, Default: true)
- `exclusionRules` (JSON, Nullable)
- `status` (String: "draft", "scheduled", "active", "paused", "completed")
- `createdAt`, `updatedAt`, `scheduledAt`, `startedAt`, `completedAt` (DateTime)

**Relations:**
- `executions` (CampaignExecution[])

**Indexes:**
- `brandId`, `status`
- `brandId`, `scheduledAt`

#### 18. **CampaignExecution** (`campaign_execution`)
Campaign execution tracking

**Fields:**
- `id` (UUID, Primary Key)
- `campaignId` (String, Foreign Key → Campaign)
- `profileId` (String, Foreign Key → CustomerProfile)
- `channel` (String: "whatsapp", "email", "sms", "push")
- `messageId` (String, Nullable)
- `sentAt`, `deliveredAt`, `openedAt`, `clickedAt`, `convertedAt` (DateTime, Nullable)
- `status` (String: "pending", "sent", "delivered", "opened", "clicked", "converted", "failed")
- `errorMessage` (String, Nullable)
- `abTestVariant` (String, Nullable)
- `createdAt`, `updatedAt` (DateTime)

**Indexes:**
- `campaignId`, `status`
- `profileId`, `sentAt`
- `status`, `sentAt`

#### 19. **CustomerJourney** (`customer_journey`)
Journey stage tracking

**Fields:**
- `id` (UUID, Primary Key)
- `brandId` (String)
- `profileId` (String, Foreign Key → CustomerProfile, Unique)
- `currentStage` (String: "awareness", "consideration", "purchase", "retention", "advocacy")
- `previousStage` (String, Nullable)
- `stageChangedAt` (DateTime)
- `touchpoints` (JSON)
- `nextMilestone` (String, Nullable)
- `nextBestAction` (String, Nullable)
- `journeyScore` (Float, Nullable)
- `createdAt`, `updatedAt` (DateTime)

**Indexes:**
- `brandId`, `currentStage`
- `brandId`, `journeyScore`

#### 20. **Attribution** (`attribution`)
Multi-touch attribution modeling

**Fields:**
- `id` (UUID, Primary Key)
- `brandId` (String)
- `profileId` (String, Foreign Key → CustomerProfile)
- `conversionId` (String)
- `touchpoints` (JSON)
- `attributionModel` (String: "first_touch", "last_touch", "linear", "time_decay", "position_based", "data_driven")
- `channelCredits` (JSON)
- `conversionType` (String: "purchase", "signup", "download")
- `conversionValue` (Decimal, Nullable)
- `conversionAt` (DateTime)
- `createdAt` (DateTime)

**Indexes:**
- `brandId`, `profileId`, `conversionAt`
- `brandId`, `attributionModel`
- `conversionAt`

#### 21. **BrandMetrics** (`brand_metrics`)
Daily brand performance snapshot

**Fields:**
- `id` (UUID, Primary Key)
- `brandId` (String, Foreign Key → Brand)
- `date` (DateTime)
- `revenue` (Decimal)
- `revenueGrowth` (Float, Nullable)
- `mrr` (Decimal, Nullable)
- `customerCount` (Int)
- `newCustomers` (Int)
- `churnRate` (Float, Nullable)
- `orderCount` (Int)
- `orderValue` (Decimal)
- `avgOrderValue` (Decimal, Nullable)
- `engagementScore` (Float, Nullable)
- `activeCustomers` (Int)
- `retentionRate` (Float, Nullable)
- `mlImpactScore` (Float, Nullable)
- `churnReduction` (Float, Nullable)
- `ltvIncrease` (Float, Nullable)
- `usageScore` (Float, Nullable)
- `apiCalls` (Int)
- `featuresUsed` (JSON, Nullable)
- `performanceScore` (Float, Nullable)
- `trend` (String, Nullable)
- `previousScore` (Float, Nullable)

**Unique Constraint:**
- `brandId`, `date`

**Indexes:**
- `brandId`, `date`
- `date`
- `performanceScore`

#### 22. **BrandMetricsHistory** (`brand_metrics_history`)
Historical metrics for charting

**Fields:**
- `id` (UUID, Primary Key)
- `brandId` (String, Foreign Key → Brand)
- `date` (DateTime)
- `revenue` (Decimal)
- `customerCount` (Int)
- `orderCount` (Int)
- `performanceScore` (Float, Nullable)
- `trend` (String, Nullable)

**Indexes:**
- `brandId`, `date`
- `date`

---

## Folder Structure

```
constintel/
├── backend/                          # Node.js/TypeScript API server
│   ├── src/
│   │   ├── db/
│   │   │   └── prismaClient.ts      # Prisma client singleton
│   │   ├── middleware/
│   │   │   └── auth.ts              # Authentication middleware
│   │   ├── routes/                  # API route handlers
│   │   │   ├── admin/               # Admin routes
│   │   │   ├── analytics/           # Analytics routes
│   │   │   ├── auth.ts             # Authentication routes
│   │   │   ├── automation.ts       # Automation routes
│   │   │   ├── campaign.ts         # Campaign routes
│   │   │   ├── crm.ts              # CRM integration routes
│   │   │   ├── customer360.ts      # Customer 360 routes
│   │   │   ├── events.ts           # Event ingestion routes
│   │   │   ├── health.ts           # Health check routes
│   │   │   ├── integrations.ts     # Integration routes
│   │   │   ├── intent.ts           # Product intent routes
│   │   │   ├── inventory.ts        # Inventory routes
│   │   │   ├── monitoring.ts       # Monitoring routes
│   │   │   ├── notifications.ts    # Notification routes
│   │   │   ├── onboarding.ts      # Onboarding routes
│   │   │   ├── profiles.ts         # Profile routes
│   │   │   ├── provisioning/      # Provisioning routes
│   │   │   ├── store/              # Store routes
│   │   │   └── streams.ts          # Redis Streams routes
│   │   ├── services/               # Business logic services
│   │   │   ├── admin/              # Admin services
│   │   │   ├── alerts/            # In-store alert services
│   │   │   ├── analytics/         # Analytics services
│   │   │   ├── auth/              # Authentication services
│   │   │   ├── automation/       # Automation services
│   │   │   ├── brand/             # Brand services
│   │   │   ├── campaign/         # Campaign services
│   │   │   ├── customer360/      # Customer 360 services
│   │   │   ├── email/            # Email services
│   │   │   ├── infrastructure/   # Infrastructure services
│   │   │   ├── ingestion/       # Event ingestion services
│   │   │   ├── integrations/    # Integration services
│   │   │   ├── intent/          # Product intent services
│   │   │   ├── inventory/       # Inventory services
│   │   │   ├── merger/         # Profile merging services
│   │   │   ├── metrics/        # Metrics services
│   │   │   ├── notifications/  # Notification services
│   │   │   ├── onboarding/    # Onboarding services
│   │   │   ├── planogram/      # Planogram services
│   │   │   ├── redis/          # Redis services (cache, queues, streams)
│   │   │   ├── store/          # Store services
│   │   │   └── streams/        # Stream processing services
│   │   ├── scripts/             # Utility scripts
│   │   │   ├── clearAllData.ts  # Clear all database data
│   │   │   ├── checkDatabase.ts # Check database status
│   │   │   ├── createAdmin.ts   # Create admin user
│   │   │   └── ...              # Other utility scripts
│   │   ├── workers/             # Background workers
│   │   │   ├── eventWorker.ts   # Event processing worker
│   │   │   └── automationWorker.ts # Automation worker
│   │   └── server.ts            # Express server setup
│   ├── prisma/
│   │   ├── schema.prisma        # Database schema
│   │   └── migrations/         # Database migrations
│   ├── Dockerfile              # Backend Docker image
│   ├── Dockerfile.worker       # Worker Docker image
│   └── package.json           # Backend dependencies
│
├── frontend/                    # Next.js dashboard
│   ├── app/                    # Next.js app directory
│   │   ├── (auth)/            # Auth pages
│   │   ├── admin/             # Admin pages
│   │   ├── analytics/         # Analytics pages
│   │   ├── crm/               # CRM pages
│   │   ├── csv-upload/        # CSV upload page
│   │   ├── customer/          # Customer pages
│   │   ├── integrations/      # Integration pages
│   │   ├── inventory/         # Inventory pages
│   │   ├── marketing/         # Marketing pages
│   │   ├── onboarding/        # Onboarding pages
│   │   ├── profiles/          # Profile pages
│   │   ├── store/             # Store pages
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── components/            # React components
│   │   ├── admin/             # Admin components
│   │   ├── analytics/         # Analytics components
│   │   ├── notifications/     # Notification components
│   │   ├── onboarding/        # Onboarding components
│   │   └── ui/                # UI components
│   ├── lib/                   # Utility libraries
│   │   └── utils/            # Utility functions
│   ├── public/                # Static assets
│   │   └── constintel-tracker.js # Tracking script
│   ├── Dockerfile            # Frontend Docker image
│   └── package.json          # Frontend dependencies
│
├── services/
│   └── ml_service/           # Python ML microservice
│       ├── api/              # FastAPI application
│       │   ├── main.py       # FastAPI app
│       │   ├── model_loader.py # Model loading
│       │   └── model_registry.py # Model versioning
│       ├── train/            # Model training
│       │   ├── feature_builder.py # Feature engineering
│       │   └── train_models.py    # Model training
│       ├── models/           # Trained models (.pkl files)
│       ├── Dockerfile        # ML service Docker image
│       └── requirements.txt  # Python dependencies
│
├── etl/
│   └── airflow_dags/         # Apache Airflow DAGs
│       ├── feature_build_dag.py # Feature building DAG
│       └── train_models_dag.py  # Model training DAG
│
├── infra/                     # Infrastructure & deployment
│   ├── docker-compose.yml    # Docker Compose configuration
│   ├── docker-compose.instance.yml # Instance-specific config
│   ├── setup-dev.sh          # Development setup script
│   ├── setup-production.sh   # Production setup script
│   ├── setup-staging.sh      # Staging setup script
│   ├── deploy-production.sh  # Production deployment
│   ├── deploy-staging.sh     # Staging deployment
│   ├── create-instance.sh    # Create new brand instance
│   ├── remove-instance.sh    # Remove brand instance
│   ├── start-instance.sh     # Start instance
│   ├── stop-instance.sh      # Stop instance
│   ├── list-instances.sh     # List instances
│   ├── migrate.sh             # Database migration
│   ├── rollback.sh            # Rollback migration
│   ├── backup-database.sh    # Backup database
│   ├── restore-backup.sh     # Restore backup
│   └── health-check.sh        # Health check script
│
├── tests/                     # Integration tests
│   └── integration/          # Integration test suite
│
├── logs/                      # Application logs
│   ├── backend.log
│   ├── frontend.log
│   ├── ml-service.log
│   ├── event-worker.log
│   └── automation-worker.log
│
└── [Documentation Files]      # Various .md documentation files
```

---

## System Design & Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Event Ingestion Layer                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Shopify  │  │WooCommerce│ │  Twilio  │  │   POS    │       │
│  │ Webhooks │  │ Webhooks  │ │ WhatsApp │  │  Import  │       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
│       └─────────────┴──────────────┴─────────────┘              │
│                         │                                         │
│                    ┌────▼─────┐                                  │
│                    │   API    │                                  │
│                    │  Router  │                                  │
│                    └────┬─────┘                                  │
└─────────────────────────┼─────────────────────────────────────────┘
                          │
┌─────────────────────────▼─────────────────────────────────────────┐
│              Identity Resolution Engine (HEART)                    │
│  ┌──────────────────────────────────────────────────────┐        │
│  │  1. Extract Identifiers (phone, email, device, etc)  │        │
│  │  2. Match to Existing Profiles                       │        │
│  │  3. Merge Profiles (auto up to 3, then manual)      │        │
│  │  4. Update Customer Profile                          │        │
│  └──────────────────────────────────────────────────────┘        │
└─────────────────────────┬─────────────────────────────────────────┘
                          │
┌─────────────────────────▼─────────────────────────────────────────┐
│                    Unified Datastore                               │
│  ┌──────────────────────┐  ┌──────────────────────┐            │
│  │   PostgreSQL          │  │      Redis            │            │
│  │  - Raw Events         │  │  - Cache              │            │
│  │  - Profiles           │  │  - Feature Store       │            │
│  │  - Features           │  │  - Streams            │            │
│  │  - Predictions        │  │  - Queues              │            │
│  │  - Merge History      │  │                       │            │
│  └──────────────────────┘  └──────────────────────┘            │
└─────────────────────────┬─────────────────────────────────────────┘
                          │
┌─────────────────────────▼─────────────────────────────────────────┐
│                    ML Microservice                                 │
│  ┌──────────────────────────────────────────────────────┐        │
│  │  Feature Builder → Model Training → Inference        │        │
│  │  - Churn Prediction (LightGBM)                       │        │
│  │  - LTV Prediction (LightGBM)                         │        │
│  │  - Segmentation (KMeans)                             │        │
│  │  - Recommendations (Future: item2vec + FAISS)        │        │
│  └──────────────────────────────────────────────────────┘        │
└─────────────────────────┬─────────────────────────────────────────┘
                          │
┌─────────────────────────▼─────────────────────────────────────────┐
│                    Dashboard (Next.js)                             │
│  - Customer 360 View                                               │
│  - Profiles List                                                   │
│  - Integrations Management                                         │
│  - Analytics Dashboard                                             │
│  - Campaign Management                                             │
│  - Store Dashboard                                                 │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Details

#### 1. Event Ingestion Layer

**Purpose**: Collect and normalize events from all channels

**Flow**:
1. Receive event payload
2. Validate signature (if applicable)
3. Normalize to internal format
4. Extract identifiers
5. Route to identity resolution

**Key Files**:
- `backend/src/routes/events.ts` - Main event ingestion endpoint
- `backend/src/routes/integrations.ts` - Integration-specific endpoints
- `backend/src/services/ingestion/eventIngestion.ts` - Core ingestion logic

#### 2. Identity Resolution Engine

**Purpose**: Merge customer profiles across channels (THE HEART OF THE SYSTEM)

**Process**:
1. Extract identifiers from event
2. Match to existing profiles
3. Auto-merge if ≤ 3 profiles match
4. Queue for manual review if > 3 profiles
5. Update unified profile

**Key Files**:
- `backend/src/services/merger/identifierExtractor.ts` - Extract identifiers
- `backend/src/services/merger/profileMatcher.ts` - Find matching profiles
- `backend/src/services/merger/profileMerger.ts` - Merge profiles

#### 3. Unified Datastore

**PostgreSQL**:
- Primary data store
- ACID compliance
- Complex queries
- Relationships

**Redis**:
- Cache for fast lookups
- Feature store
- Event queues
- Redis Streams for event pipelines
- Distributed locking

#### 4. ML Microservice

**Architecture**:
- FastAPI application
- Model loader & registry
- Feature builder
- Training pipeline
- Inference endpoints

**Models**:
- Churn Prediction (LightGBM)
- LTV Prediction (LightGBM)
- Segmentation (KMeans)

#### 5. Background Workers

**Event Worker**:
- Consumes events from Redis queue
- Processes events asynchronously
- Handles retries and errors

**Automation Worker**:
- Consumes automation tasks
- Executes automation triggers
- Handles automation actions

---

## How It Works

### Data Flow Example 1: Shopify Order Event

```
1. Shopify sends webhook → /api/integrations/shopify
2. Validate webhook signature
3. Extract identifiers (email, phone, order_id)
4. Create raw_event in database
5. Match to existing profile (or create new)
6. Update customer_profile (lifetime_value, total_orders)
7. Build features (RFM)
8. Request ML predictions
9. Store predictions in database
10. Return success response
```

### Data Flow Example 2: WhatsApp Message

```
1. Twilio sends webhook → /api/integrations/twilio
2. Extract identifiers (whatsapp number)
3. Match to profile via phone/whatsapp
4. Create raw_event (event_type: whatsapp_message)
5. Update profile (last_seen)
6. Check automation triggers
7. Execute automation if triggered
```

### Data Flow Example 3: Profile Merge

```
1. New event arrives with phone="+1234567890"
2. Identifier extractor finds phone
3. Profile matcher finds 2 existing profiles with same phone
4. Profile merger checks: 2 ≤ 3 → auto-merge
5. Merge profiles:
   - Combine all identifiers
   - Sum lifetime_value
   - Sum total_orders
   - Update profile_strength
6. Create merge_history record
7. Update all linked events
8. Invalidate Redis cache
```

### Data Flow Example 4: ML Prediction

```
1. Customer profile updated
2. Feature builder calculates RFM features
3. Store features in database
4. Request prediction from ML service
5. ML service loads model
6. ML service calculates predictions
7. Store predictions in database
8. Return predictions to caller
```

### Data Flow Example 5: Campaign Execution

```
1. Campaign scheduled/triggered
2. Query target segment
3. For each customer in segment:
   - Check exclusion rules
   - Personalize message
   - Send via channel (WhatsApp/Email/SMS)
   - Create campaign_execution record
4. Track performance metrics
5. Update campaign status
```

---

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - User logout

### Events
- `POST /api/events` - Ingest event
- `GET /api/events` - List events
- `GET /api/events/:id` - Get event details

### Profiles
- `GET /api/profiles` - List profiles
- `GET /api/profiles/:id` - Get profile details
- `GET /api/profiles/:id/merge-history` - Get merge history
- `POST /api/profiles/:id/merge` - Manual merge

### Customer 360
- `GET /api/customer360/:id` - Get customer 360 view
- `GET /api/customer360/:id/timeline` - Get customer timeline
- `GET /api/customer360/:id/journey` - Get customer journey

### Integrations
- `POST /api/integrations/shopify` - Shopify webhook
- `POST /api/integrations/woocommerce` - WooCommerce webhook
- `POST /api/integrations/twilio` - Twilio webhook
- `POST /api/integrations/pos` - POS data import
- `POST /api/integrations/csv` - CSV import
- `POST /api/integrations/crm/sync` - CRM sync

### Analytics
- `GET /api/analytics/time-series` - Time series data
- `GET /api/analytics/cohorts` - Cohort analysis
- `GET /api/analytics/funnels` - Funnel analysis
- `GET /api/analytics/segments` - Segment analytics
- `GET /api/analytics/channels` - Channel attribution
- `GET /api/analytics/predictions` - Prediction analytics
- `GET /api/analytics/anomalies` - Anomaly detection
- `GET /api/analytics/insights` - Insights
- `GET /api/analytics/reports` - Custom reports
- `POST /api/analytics/ask` - Natural language queries

### Campaigns
- `GET /api/campaigns` - List campaigns
- `POST /api/campaigns` - Create campaign
- `GET /api/campaigns/:id` - Get campaign details
- `PUT /api/campaigns/:id` - Update campaign
- `DELETE /api/campaigns/:id` - Delete campaign
- `POST /api/campaigns/:id/execute` - Execute campaign

### Automations
- `GET /api/automations` - List automations
- `POST /api/automations` - Create automation
- `GET /api/automations/:id` - Get automation details
- `PUT /api/automations/:id` - Update automation
- `DELETE /api/automations/:id` - Delete automation

### Inventory
- `GET /api/inventory/trending` - Get trending products
- `GET /api/inventory/demand-signals` - Get demand signals
- `GET /api/inventory/store-recommendations` - Get store recommendations
- `GET /api/inventory/product-insights` - Get product insights

### Store
- `GET /api/store/visits` - List store visits
- `POST /api/store/visits` - Create store visit
- `GET /api/store/alerts` - Get in-store alerts
- `GET /api/store/dashboard` - Get store dashboard

### Intent
- `GET /api/intent/product-intents` - Get product intents
- `POST /api/intent/track` - Track product intent

### Monitoring
- `GET /api/monitoring/health` - Health check
- `GET /api/monitoring/queues` - Queue statistics
- `GET /api/monitoring/stats` - System statistics

### Admin
- `GET /api/admin/brands` - List brands
- `POST /api/admin/brands` - Create brand
- `GET /api/admin/metrics` - Get brand metrics
- `GET /api/admin/market` - Get market data

### Streams
- `GET /api/streams/info` - Get stream info
- `GET /api/streams/:streamName` - Read from stream

---

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Cache/Queue**: Redis
- **Validation**: Zod

### Frontend
- **Framework**: Next.js (React)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Date Handling**: date-fns

### ML Service
- **Language**: Python
- **Framework**: FastAPI
- **ML Libraries**: LightGBM, scikit-learn, pandas, numpy
- **Model Storage**: Pickle (.pkl files)

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **ETL**: Apache Airflow
- **Monitoring**: Custom monitoring endpoints

### Development Tools
- **Package Manager**: npm
- **Build Tool**: TypeScript compiler
- **Linting**: ESLint
- **Testing**: Jest

---

## Key Design Principles

1. **Unified Customer View**: Single source of truth for customer data
2. **Event-Driven Architecture**: Asynchronous event processing
3. **Scalability**: Queue-based processing, horizontal scaling
4. **Reliability**: Idempotency, retries, error handling
5. **Observability**: Comprehensive logging and monitoring
6. **Security**: Webhook signature validation, authentication
7. **Performance**: Caching, indexing, optimized queries
8. **Flexibility**: JSON-based flexible schemas
9. **Auditability**: Complete merge history and event tracking

---

## Future Enhancements

1. **Recommendation Engine**: item2vec + FAISS for product recommendations
2. **Real-time Streaming**: Kafka/Redpanda for event pipelines
3. **Advanced Segmentation**: RFM-based segments with ML
4. **Data Subject Rights**: GDPR compliance (delete, export)
5. **Multi-tenant**: Enhanced multi-brand isolation
6. **API Rate Limiting**: Protect against abuse
7. **Authentication**: OAuth2 / API keys
8. **Advanced Analytics**: Predictive analytics, forecasting

---

**End of Comprehensive System Overview**

