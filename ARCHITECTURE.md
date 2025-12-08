# Architecture - Unified Commerce Intelligence Platform

**Last Updated**: December 2024

## System Architecture Overview

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
│  │  - Predictions        │  │                       │            │
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
│  - CSV Upload                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Event Ingestion Layer

**Purpose**: Collect and normalize events from all channels

**Input Sources**:
- Shopify webhooks (orders, customers, carts)
- WooCommerce webhooks (orders, customers)
- Twilio WhatsApp (messages, status updates)
- POS systems (CSV import, API)
- Custom API endpoints

**Processing**:
1. Receive event payload
2. Validate signature (if applicable)
3. Normalize to internal format
4. Extract identifiers
5. Route to identity resolution

**Files**:
- `backend/src/routes/events.ts` - Main event ingestion endpoint
- `backend/src/routes/integrations.ts` - Integration-specific endpoints
- `backend/src/services/ingestion/eventIngestion.ts` - Core ingestion logic

### 2. Identity Resolution Engine

**Purpose**: Merge customer profiles across channels (THE HEART OF THE SYSTEM)

**Identifier Priority**:
1. `phone` / `email` (highest confidence)
2. `loyalty_id`
3. `device_id`
4. `cookie_id` (lowest confidence)

**Merging Rules**:
- Auto-merge if ≤ 3 profiles match
- Manual review queue if > 3 profiles
- Preserve all identifiers in merged profile
- Audit trail in `merge_history`

**Files**:
- `backend/src/services/merger/identifierExtractor.ts` - Extract identifiers from events
- `backend/src/services/merger/profileMatcher.ts` - Find matching profiles
- `backend/src/services/merger/profileMerger.ts` - Merge profiles

**Database**:
- `customer_profile` - Unified profiles
- `merge_history` - Audit log
- `manual_merge_queue` - Review queue

### 3. Customer 360 Profile

**Data Stored**:
```json
{
  "id": "uuid",
  "brand_id": "string",
  "identifiers": {
    "phone": "+1234567890",
    "email": "customer@example.com",
    "loyalty_id": "LOY123",
    "device_id": "device_abc",
    "cookie_id": "cookie_xyz",
    "whatsapp": "+1234567890"
  },
  "profile_strength": 85,
  "lifetime_value": 1250.50,
  "total_orders": 12,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

**Related Data**:
- Events: `customer_raw_event` (linked via `customer_profile_id`)
- Features: `features` table (RFM, category affinity, etc.)
- Predictions: `predictions` table (churn, LTV, segment, recommendations)

### 4. Unified Datastore

#### PostgreSQL Schema

**Core Tables**:
- `customer_raw_event` - All ingested events
- `customer_profile` - Unified customer profiles
- `features` - Feature store (RFM, category affinity, etc.)
- `predictions` - ML predictions cache
- `merge_history` - Profile merge audit log
- `manual_merge_queue` - Manual review queue
- `model_version` - ML model registry

**Indexes**:
- `customer_profile.brand_id`
- `customer_profile.profile_strength`
- `customer_raw_event.brand_id, created_at`
- `customer_raw_event.customer_profile_id`
- `customer_raw_event.event_type`
- `features.profile_id`
- `features.feature_name`

**Future Tables**:
- `inventory` - Product inventory
- `connection_logs` - Integration connection logs

#### Redis Usage

**Cache**:
- Profile lookups by identifier
- Feature values
- Prediction results

**Feature Store**:
- Real-time feature values
- Session data
- Temporary event buffers

**Streams** (Future):
- `events.raw` - Raw events pipeline
- `events.normalized` - Normalized events
- `profiles.merge_requests` - Merge requests
- `predictions.requests` - Prediction requests

### 5. ML Microservice

**Architecture**:
```
┌─────────────────────────────────────────┐
│         FastAPI Application             │
│  - /health                              │
│  - /predict/churn                       │
│  - /predict/ltv                         │
│  - /predict/all                         │
│  - /models/versions                     │
│  - /models/metrics/summary              │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      Model Loader & Registry            │
│  - Load trained models from disk        │
│  - Cache models in memory               │
│  - Track model versions                 │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      Feature Builder                    │
│  - Calculate RFM features               │
│  - Category affinity                    │
│  - Session counts                       │
│  - Profile strength                     │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      Model Training                     │
│  - Churn: LightGBM (binary)            │
│  - LTV: LightGBM (regression)          │
│  - Segmentation: KMeans (clustering)   │
└─────────────────────────────────────────┘
```

**Models**:
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

**Training Pipeline**:
1. Build features for all profiles
2. Split data (80/20 train/test)
3. Train models
4. Calculate evaluation metrics
5. Save models to disk
6. Save version metadata to database

**Files**:
- `services/ml_service/train/feature_builder.py` - Feature engineering
- `services/ml_service/train/train_models.py` - Model training
- `services/ml_service/api/main.py` - FastAPI app
- `services/ml_service/api/model_loader.py` - Model loading
- `services/ml_service/api/model_registry.py` - Versioning API

### 6. Dashboard (Next.js)

**Pages**:
- `/` - Home dashboard (KPIs, system status)
- `/profiles` - Customer profiles list
- `/customer/360` - Customer 360 view (unified profile + predictions)
- `/integrations` - Integrations management
- `/csv-upload` - CSV bulk import

**Features**:
- Real-time profile updates
- ML predictions display
- Merge history viewer
- Integration status
- CSV upload with preview

**Files**:
- `frontend/app/page.tsx` - Home
- `frontend/app/profiles/page.tsx` - Profiles list
- `frontend/app/customer/360/page.tsx` - Customer 360
- `frontend/app/integrations/page.tsx` - Integrations
- `frontend/app/csv-upload/page.tsx` - CSV upload

### 7. Integrations Framework

**Supported Integrations**:

1. **Shopify**
   - Webhook signature validation
   - Order events → purchase events
   - Customer events → profile updates

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

**Files**:
- `backend/src/services/integrations/shopify.ts`
- `backend/src/services/integrations/woocommerce.ts`
- `backend/src/services/integrations/twilio.ts`
- `backend/src/services/integrations/pos.ts`
- `backend/src/services/integrations/csv.ts`
- `backend/src/services/integrations/crm.ts`
- `backend/src/routes/integrations.ts`

### 8. Observability & Debugging

**Tools**:
- **Docker Logs**: Human-readable logs for each service
- **Redis Commander**: GUI for Redis inspection (`http://localhost:8081`)
- **pgAdmin**: GUI for PostgreSQL (`http://localhost:5050`)
- **Event Stream Viewer**: Redis Streams inspection (future)
- **Merge Logs API**: `/api/profiles/{id}/merge-history`

**Logging Standards**:
- Never log raw PII (phone, email)
- Hash identifiers in logs
- Include request IDs for tracing
- Structured logging (JSON)

### 9. Streaming Architecture

**Current (MVP)**: Redis Streams

**Topics**:
- `events.raw` - Raw ingested events
- `events.normalized` - Normalized events
- `profiles.merge_requests` - Profile merge requests
- `predictions.requests` - ML prediction requests

**Future**: Kafka/Redpanda for production scale

### 10. Developer Experience

**Code Generation Standards**:
- Always inspect `schema.prisma` before creating tables
- Generate migrations for schema changes
- Use environment variables for all secrets
- Include file headers with assumptions and how-to-run
- Document local setup steps

**File Header Template**:
```python
# GENERATOR: [GENERATOR_NAME]
# ASSUMPTIONS: [List assumptions]
# HOW TO RUN: [How to run/test this file]
# TODO: [Any TODOs for developer review]
```

**Testing**:
- Unit tests for critical paths (merger, ingestion)
- Integration tests for API endpoints
- Test data generators for development

## Data Flow Examples

### Example 1: Shopify Order Event

```
1. Shopify sends webhook → /api/integrations/shopify
2. Validate signature
3. Extract identifiers (email, phone, order_id)
4. Create raw_event
5. Match to existing profile (or create new)
6. Update customer_profile (lifetime_value, total_orders)
7. Build features (RFM)
8. Request ML predictions
9. Store predictions
10. Return success
```

### Example 2: WhatsApp Message

```
1. Twilio sends webhook → /api/integrations/twilio
2. Extract identifiers (whatsapp number)
3. Match to profile via phone/whatsapp
4. Create raw_event (event_type: whatsapp_message)
5. Update profile (last_seen)
6. Trigger automation (if configured)
```

### Example 3: Profile Merge

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

## Security & Privacy

**PII Handling**:
- Never log raw PII (phone, email)
- Hash identifiers in logs
- Environment variables for all secrets
- Data subject delete workflow (future)

**API Security**:
- Webhook signature validation (Shopify, WooCommerce)
- Brand ID validation
- Rate limiting (future)
- Authentication (future)

## Performance Considerations

**Database**:
- GIN index on `identifiers` JSONB column
- Indexes on frequently queried columns
- Connection pooling

**Caching**:
- Redis cache for profile lookups
- Feature store caching
- Prediction result caching (1 hour TTL)

**ML Service**:
- Model caching in memory
- Batch prediction support (future)
- Async prediction requests (future)

## Future Enhancements

1. **Recommendation Engine**: item2vec + FAISS for product recommendations
2. **Real-time Streaming**: Kafka/Redpanda for event pipelines
3. **Advanced Segmentation**: RFM-based segments with ML
4. **Automation Engine**: Trigger actions based on predictions
5. **Data Subject Rights**: GDPR compliance (delete, export)
6. **Multi-tenant**: Support multiple brands with isolation
7. **API Rate Limiting**: Protect against abuse
8. **Authentication**: OAuth2 / API keys

