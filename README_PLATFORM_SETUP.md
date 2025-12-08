# Unified Commerce Platform - Setup Guide

## Project Overview

**Product**: Unified Commerce / Customer Intelligence Platform
- Unifies online + offline + POS + WhatsApp + inventory + ML
- Real-time customer profile merging and event ingestion
- ML-powered churn prediction, LTV forecasting, and recommendations

## Platform Vision

This is a **production-ready Unified Commerce Intelligence Platform** — the "customer brain" for retail & D2C brands.

**Core Mission**:
- Build ONE unified view of the customer across all channels
- Understand who the customer is, what they want, and what they are likely to do next
- Provide ML-based predictions and recommendations
- Enable brands to run smart automations based on real behavior

**Key Differentiator**: This is NOT a CRM — it's an omnichannel intelligence engine that merges:
- Ecommerce events (Shopify, WooCommerce)
- Offline POS purchases
- WhatsApp messages
- QR scans & device identifiers
- Loyalty/phone/email identifiers

See `ARCHITECTURE.md` for detailed system architecture.

## Tech Stack

- **Backend**: Node.js + TypeScript, Prisma ORM, Express/Fastify
- **Frontend**: Next.js (React)
- **Database**: PostgreSQL
- **Cache/Streams**: Redis, Kafka/Redpanda (fallback: Redis Streams)
- **ML Service**: Python + FastAPI
- **ETL/Scheduling**: Apache Airflow
- **Deployment**: Docker, Kubernetes
- **CI/CD**: GitHub Actions

## Project Structure

```
/
├─ backend/          # Node.js/TypeScript API server
├─ frontend/         # Next.js dashboard
├─ services/
│  └─ ml_service/    # Python ML microservice
├─ etl/
│  └─ airflow_dags/  # Batch processing DAGs
├─ infra/            # Docker compose, K8s configs
├─ prisma/           # Shared Prisma schema
├─ tests/            # Integration tests
└─ README_PLATFORM_SETUP.md
```

## Core Database Schema

### Tables (to be created via migrations):
- `customer_raw_event` - Raw event ingestion
- `customer_profile` - Unified customer profiles
- `predictions` - ML predictions cache
- `features` - Feature store
- `merge_history` - Profile merge audit log
- `manual_merge_queue` - Manual review queue

## Quick Start

### Option 1: Isolated Instance Setup (Recommended for Multiple Environments)

For complete data isolation between environments/brands, use isolated instances:

```bash
cd infra

# Create an isolated instance
./create-instance.sh dev 0          # Development (ports: 3000, 3001, 8000)
./create-instance.sh staging 1      # Staging (ports: 3010, 3011, 8010)
./create-instance.sh prod 2         # Production (ports: 3020, 3021, 8020)

# Start an instance
./start-instance.sh dev

# List all instances
./list-instances.sh
```

Each instance has completely separate databases, Redis, and data. See [Instance Management Guide](infra/INSTANCE_MANAGEMENT.md) for details.

### Option 2: Automated Setup (Single Instance)

```bash
# 1. Create .env file (see Environment Variables section below)
cp env.template .env
# Edit .env with your values

# 2. Run setup script
./infra/setup-dev.sh
```

### Option 3: Manual Setup

1. **Setup Environment**
   ```bash
   cp env.template .env
   # Edit .env with your values
   ```

2. **Start Infrastructure**
   ```bash
   docker-compose -f infra/docker-compose.yml up -d postgres redis
   ```

3. **Run Migrations**
   ```bash
   cd backend
   npm install
   npx prisma generate
   npx prisma migrate dev --name init
   ```

4. **Start Services**
   ```bash
   # From project root
   docker-compose -f infra/docker-compose.yml up -d
   ```

## Verification Commands

### 1. Check Service Health
```bash
# Backend API
curl http://localhost:3000/health

# ML Service
curl http://localhost:8000/health

# Expected response:
# {"status":"healthy","timestamp":"...","services":{"database":"connected"}}
```

### 2. Ingest a Test Event
```bash
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -H "x-brand-id: test-brand" \
  -d '{
    "event_type": "purchase",
    "payload": {
      "phone": "1234567890",
      "email": "test@example.com",
      "total": 99.99,
      "items": [{"product_id": "prod_123", "quantity": 1}]
    }
  }'
```

### 3. List Customer Profiles
```bash
curl http://localhost:3000/api/profiles \
  -H "x-brand-id: test-brand"
```

### 4. Get Customer 360 View
```bash
# First, get a profile ID from step 3, then:
PROFILE_ID="<profile-id-from-step-3>"

curl http://localhost:3000/api/profiles/$PROFILE_ID \
  -H "x-brand-id: test-brand"
```

### 5. Test ML Predictions
```bash
# Get predictions for a profile
curl -X POST http://localhost:8000/predict/all \
  -H "Content-Type: application/json" \
  -d '{"profile_id": "<profile-id>"}'
```

### 6. Check Database
```bash
# Connect to Postgres
docker exec -it constintel-postgres psql -U constintel -d constintel

# Run queries:
SELECT COUNT(*) FROM customer_profile;
SELECT COUNT(*) FROM customer_raw_event;
SELECT * FROM customer_profile LIMIT 5;
```

## Environment Variables

Create a `.env` file in the project root with these variables:

```bash
# Database
DATABASE_URL="postgresql://constintel:constintel@localhost:5432/constintel?schema=public"
POSTGRES_USER=constintel
POSTGRES_PASSWORD=constintel
POSTGRES_DB=constintel

# Redis
REDIS_URL="redis://localhost:6379"

# Backend API
BACKEND_PORT=3000
NODE_ENV=development

# ML Service
ML_SERVICE_PORT=8000
ML_MODEL_PATH="./models"

# Frontend
NEXT_PUBLIC_API_URL="http://localhost:3000"
NEXT_PUBLIC_ML_API_URL="http://localhost:8000"

# Feature Flags
ENABLE_AUTO_MERGE="true"
MAX_AUTO_MERGE_PROFILES=3
```

See `env.template` for the complete list.

## Instance Management

For running multiple isolated environments (dev/staging/prod or multiple brands), see the [Instance Management Guide](infra/INSTANCE_MANAGEMENT.md).

**Quick Commands:**
```bash
cd infra
./create-instance.sh <name> <id>    # Create new isolated instance
./start-instance.sh <name>          # Start an instance
./stop-instance.sh <name>           # Stop an instance
./list-instances.sh                 # List all instances
```

Each instance has:
- Separate database (complete data isolation)
- Separate Redis instance
- Unique ports (no conflicts)
- Isolated Docker network and volumes

## Available Generators

Run any of these commands in Cursor chat:

- ✅ **FULL_PLATFORM** - Complete Phase 1 codebase (backend, frontend, ML, ETL, infra) - **COMPLETE**
- ✅ **INTEGRATIONS** - API connectors (Shopify, WooCommerce, Twilio, POS, CSV) - **COMPLETE**
- ✅ **SANDBOX** - Test data generators, sample CSV, verification scripts - **COMPLETE**
- **ML_PHASE1** - Full ML microservice (training, inference, feature builders, model registry)
- **UI** - Next.js dashboard pages and Customer 360 view
- **CI** - GitHub Actions workflows and test steps

See `INTEGRATIONS_SETUP.md` for integration setup and `SANDBOX_USAGE.md` for test data generation.

## Development Notes

- All secrets must be in `.env` (never commit)
- Use Prisma migrations for schema changes
- Log only hashed identifiers, never raw PII
- Parameterize all SQL queries
- Include unit tests for critical paths

## Running Tests

```bash
# Backend unit tests
cd backend
npm test

# Run specific test file
npm test -- identifierExtractor
```

## Project Status

✅ **FULL_PLATFORM Generator Complete**  
✅ **INTEGRATIONS Generator Complete**

Generated components:
- ✅ Prisma schema with all core tables
- ✅ Backend API (Node.js + TypeScript + Express)
- ✅ ML Service (Python + FastAPI)
- ✅ Frontend (Next.js with Customer 360 view)
- ✅ Airflow DAGs for batch processing
- ✅ Docker Compose setup
- ✅ Unit tests for critical services
- ✅ **Shopify webhook integration**
- ✅ **WooCommerce webhook integration**
- ✅ **Twilio WhatsApp integration**
- ✅ **Generic POS integration**
- ✅ **CSV import functionality**

Next steps:
- **Generate Test Data**: Run `cd backend && npm run seed` to populate database
- **Verify Setup**: Run `cd backend && npm run verify:integrations` to test all endpoints
- Run `CI` generator for GitHub Actions workflows
- Configure integration credentials (see `INTEGRATIONS_SETUP.md`)

---

**Status**: FULL_PLATFORM, INTEGRATIONS, and SANDBOX generators complete. Platform ready for development and testing.

