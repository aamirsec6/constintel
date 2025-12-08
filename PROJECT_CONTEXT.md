# Project Context - Unified Commerce Intelligence Platform

**Last Updated**: December 2024  
**Status**: Production-Ready Platform Development

## Platform Vision

**ConstIntel** is a **production-ready Unified Commerce Intelligence Platform** — the "customer brain" for retail & D2C brands.

### Core Mission

👉 Build **ONE unified view** of the customer across all channels  
👉 Understand **who the customer is**, **what they want**, and **what they are likely to do next**  
👉 Provide **ML-based predictions and recommendations**  
👉 Enable brands to run **smart automations** based on real behavior  
👉 Give analysts a **clean Customer 360 dashboard**

### What This Platform Is NOT

❌ **NOT a CRM** like HubSpot or Zoho  
❌ **NOT a demo or prototype** — this is production-ready code  
❌ **NOT a simple data aggregator** — this is an intelligence engine

### What This Platform IS

✅ **Omnichannel Intelligence Engine** that merges:
- Ecommerce events (views, carts, purchases)
- Offline POS purchases
- WhatsApp messages and interactions
- QR scans & store engagement
- Device identifiers (cookies, device_id)
- Loyalty/phone/email identifiers

## Core Components

### 1. Event Ingestion Layer
- Collects ALL events from all channels
- Shopify / WooCommerce webhooks
- POS data imports
- WhatsApp inbound/outbound events
- CSV bulk import
- Custom API ingestion

**Flow**: Event → Normalized → Matched to Profile

### 2. Identity Resolution / Merger Engine (THE HEART)
- Merges profiles using identifiers:
  - phone, email, loyalty_id, device_id, cookie_id, whatsapp number, POS bill metadata
- **Rules**:
  - Priority: phone/email > loyalty > device > cookie
  - Auto-merge up to 3 profiles
  - Beyond that → manual review queue
- Updates:
  - `customer_profile` table
  - `merge_history` table
  - Redis cache for fast reads

### 3. Customer 360 Profile
For each customer, stores:
- identifiers
- last seen
- purchase history
- browsing history
- category affinity
- lifetime value
- total orders
- channels used
- ML predictions
- recommended products

### 4. Unified Datastore
**PostgreSQL**:
- `customer_raw_event`
- `customer_profile`
- `features` / `ml_features`
- `merge_history`
- `predictions`
- `model_version` (ML model registry)
- `inventory` (future)
- `connection_logs` (future)

**Redis**:
- Cache
- Feature store
- Redis Streams for event pipelines

### 5. ML Microservice (FastAPI + Python)
**Models**:
- Churn prediction (LightGBM)
- LTV prediction (LightGBM)
- Customer segmentation (KMeans)
- Recommendation engine (item2vec + FAISS - future)

**Flow**:
- Reads features from Postgres/Redis
- Returns predictions to backend
- Stores results in `predictions` table
- Tracks versions in `model_version` table

### 6. Dashboard (Next.js)
**Pages**:
- Dashboard (metrics, KPIs)
- Profiles list
- Customer 360 page
- Merge logs
- Integrations page
- CSV upload

### 7. Integrations Framework
**Supported**:
- ✅ Shopify (webhook signature validation)
- ✅ WooCommerce (webhook signature validation)
- ✅ Twilio WhatsApp
- ✅ Generic POS
- ✅ CSV import
- ✅ CRM (Salesforce, HubSpot, Generic REST)
- 🔜 Magento (future)
- 🔜 Zoho / HubSpot CRM sync (future)

**Requirements**:
- Use official SDK when possible
- Validate signatures (Shopify)
- Map payloads to internal `raw_event` format

### 8. Observability & Debugging
**Tools**:
- Docker logs for each service (human-readable)
- Redis Commander (GUI)
- pgAdmin (GUI)
- Event stream viewer (Redis Streams)
- Merge logs via API & DB

### 9. Streaming Architecture
**MVP**: Redis Streams
- Topics: `events.raw`, `events.normalized`, `profiles.merge_requests`, `predictions.requests`

**Future**: Kafka/Redpanda

### 10. Developer Experience Requirements

**Cursor AI Must**:
- ✅ Always inspect codebase before generating new code
- ✅ NEVER assume table names → check `schema.prisma` first
- ✅ Generate migrations for new tables if required
- ✅ Use environment variables for secrets
- ✅ Document how to run everything locally

**Code Generation Standards**:
- Behave like: Senior backend engineer, Senior ML engineer, System architect, DX-focused teammate
- Every file must include:
  - Header comments with assumptions
  - How to run/test the file
  - TODOs for developer review if needed

## Database Schema

**Status**: ✅ Created via Prisma schema

**Tables**:
- `customer_raw_event` - Raw event ingestion
- `customer_profile` - Unified customer profiles
- `predictions` - ML predictions cache
- `features` - Feature store
- `merge_history` - Profile merge audit log
- `manual_merge_queue` - Manual review queue
- `model_version` - ML model registry with metrics

**Migration**: Run `npx prisma migrate dev` in `backend/` directory

## Generated Files Status

### Backend ✅
- `backend/prisma/schema.prisma` - Complete database schema
- `backend/src/server.ts` - Express server
- `backend/src/db/prismaClient.ts` - Prisma client singleton
- `backend/src/services/merger/` - Identifier extraction, profile matching, merging
- `backend/src/services/ingestion/` - Event ingestion service
- `backend/src/services/integrations/` - Integration services
- `backend/src/routes/` - API routes
- `backend/src/scripts/` - Test data generators

### ML Service ✅
- `services/ml_service/api/main.py` - FastAPI application
- `services/ml_service/api/model_loader.py` - Model loading
- `services/ml_service/api/model_registry.py` - Model versioning API
- `services/ml_service/train/feature_builder.py` - Feature engineering
- `services/ml_service/train/train_models.py` - Model training with metrics

### Frontend ✅
- `frontend/app/page.tsx` - Home dashboard
- `frontend/app/profiles/page.tsx` - Profiles listing
- `frontend/app/customer/360/page.tsx` - Customer 360 view
- `frontend/app/integrations/page.tsx` - Integrations management
- `frontend/app/csv-upload/page.tsx` - CSV upload

### Infrastructure ✅
- `infra/docker-compose.yml` - Docker Compose setup
- `infra/setup-dev.sh` - Automated setup script

## Model Versions

**Status**: ✅ Models trained with evaluation metrics

**Models**:
- Churn Model (LightGBM) - Accuracy, Precision, Recall, F1, ROC-AUC
- LTV Model (LightGBM) - RMSE, MAE, R², MAPE
- Segmentation Model (KMeans) - Silhouette Score, Inertia

**Registry**: All versions tracked in `model_version` table

## TODOs / Assumptions

- [x] Prisma schema created with all core tables
- [x] Backend API with event ingestion and profile management
- [x] ML service with inference endpoints and model versioning
- [x] Frontend with Customer 360 view
- [x] Docker Compose setup
- [x] Integrations (Shopify, WooCommerce, Twilio, POS, CSV, CRM)
- [x] Model versioning and evaluation metrics
- [ ] Add GIN index on identifiers column for performance
- [ ] Implement Redis Streams for event pipelines
- [ ] Add recommendation engine (item2vec + FAISS)
- [ ] Set up CI/CD pipeline

## Next Steps

1. **Setup Environment**: `cp env.template .env` and configure
2. **Run Setup**: `./infra/setup-dev.sh`
3. **Generate Test Data**: `cd backend && npm run seed`
4. **Train Models**: `cd services/ml_service && python3 train/train_models.py`
5. **Start Services**: `docker-compose -f infra/docker-compose.yml up`
6. **Access Dashboard**: `http://localhost:3001`

---

**This is the authoritative context for all code generation. Always refer to this document when building new features.**
