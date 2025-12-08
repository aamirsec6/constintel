# ConstIntel - Unified Commerce Platform

**Unified Commerce / Customer Intelligence Platform** - The "customer brain" for retail & D2C brands.

## Quick Start

```bash
# 1. Setup environment
cp env.template .env
# Edit .env with your values

# 2. Run automated setup
./infra/setup-dev.sh

# 3. Access the application
# Frontend: http://localhost:3001
# Backend API: http://localhost:3000
# ML Service: http://localhost:8000
```

## Documentation

- **[README_PLATFORM_SETUP.md](README_PLATFORM_SETUP.md)** - Complete setup guide
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture and design
- **[PROJECT_CONTEXT.md](PROJECT_CONTEXT.md)** - Platform context and overview
- **[INTEGRATIONS_SETUP.md](INTEGRATIONS_SETUP.md)** - Integration guides (Shopify, WooCommerce, Twilio, etc.)
- **[REDIS_DOCKER_CONNECTION.md](REDIS_DOCKER_CONNECTION.md)** - Redis setup and connection guide
- **[REDIS_STREAMS_SETUP.md](REDIS_STREAMS_SETUP.md)** - Redis Streams documentation
- **[ML_MODEL_VERSIONING.md](ML_MODEL_VERSIONING.md)** - ML model versioning guide
- **[RECOMMENDATION_ENGINE.md](RECOMMENDATION_ENGINE.md)** - Recommendation engine documentation
- **[SANDBOX_USAGE.md](SANDBOX_USAGE.md)** - Test data and sandbox usage
- **[PRD_IMPLEMENTATION.md](PRD_IMPLEMENTATION.md)** - PRD implementation details

## Project Structure

```
constintel/
├── backend/          # Node.js/TypeScript API server
├── frontend/         # Next.js dashboard
├── services/
│   └── ml_service/   # Python ML microservice
├── etl/              # Airflow DAGs
├── infra/            # Docker compose, setup scripts
└── tests/            # Integration tests
```

## Features

- ✅ Real-time event ingestion
- ✅ Unified customer profiles
- ✅ ML-powered predictions (churn, LTV, segmentation)
- ✅ Integrations (Shopify, WooCommerce, Twilio, POS, CSV)
- ✅ Customer 360 view
- ✅ Recommendation engine
- ✅ Redis Streams for event processing

## Tech Stack

- **Backend**: Node.js + TypeScript, Prisma ORM, Express
- **Frontend**: Next.js (React)
- **Database**: PostgreSQL
- **Cache/Streams**: Redis
- **ML Service**: Python + FastAPI
- **ETL**: Apache Airflow
- **Deployment**: Docker

## Development

```bash
# Start services
docker-compose -f infra/docker-compose.yml up -d

# View logs
docker-compose -f infra/docker-compose.yml logs -f

# Stop services
docker-compose -f infra/docker-compose.yml down
```

## License

ISC

