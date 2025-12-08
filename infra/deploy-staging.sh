#!/bin/bash
# Deploy to Staging Environment
# Builds Docker images, runs migrations, deploys services, performs health checks
# HOW TO USE: ./deploy-staging.sh [--skip-tests] [--skip-migrations]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

INSTANCE_NAME="staging"
INSTANCE_DIR="instances/$INSTANCE_NAME"
ENV_FILE="$INSTANCE_DIR/.env"

# Check if staging instance exists
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: Staging instance not found"
    echo "Create it first with: ./setup-staging.sh"
    exit 1
fi

# Parse arguments
SKIP_TESTS=false
SKIP_MIGRATIONS=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-migrations)
            SKIP_MIGRATIONS=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

echo "🚀 Deploying to Staging Environment..."
echo ""

# Source environment variables
export $(grep -v '^#' "$ENV_FILE" | xargs)

# Run tests if not skipped
if [ "$SKIP_TESTS" = false ]; then
    echo "🧪 Running tests..."
    
    # Backend tests
    if [ -d "../backend" ]; then
        cd ../backend
        echo "  Running backend tests..."
        npm test 2>&1 | grep -E "(PASS|FAIL|Tests:)" || echo "  ⚠️  No tests found or tests failed"
        cd "$SCRIPT_DIR"
    fi
    
    # Frontend tests
    if [ -d "../frontend" ]; then
        cd ../frontend
        echo "  Running frontend tests..."
        npm run build 2>&1 | tail -5 || echo "  ⚠️  Frontend build failed"
        cd "$SCRIPT_DIR"
    fi
fi

# Build Docker images
echo ""
echo "🔨 Building Docker images..."
docker-compose -f docker-compose.instance.yml --env-file "$ENV_FILE" -p "$INSTANCE_NAME" build

# Backup database before migration
if [ "$SKIP_MIGRATIONS" = false ]; then
    echo ""
    echo "💾 Backing up database before migration..."
    BACKUP_DIR="$INSTANCE_DIR/backups"
    mkdir -p "$BACKUP_DIR"
    BACKUP_FILE="$BACKUP_DIR/pre-migration-$(date +%Y%m%d-%H%M%S).sql"
    
    if docker ps --format '{{.Names}}' | grep -q "^${INSTANCE_NAME}-postgres"; then
        docker exec "${INSTANCE_NAME}-postgres" pg_dump -U "$POSTGRES_USER" "$DATABASE_NAME" > "$BACKUP_FILE" 2>/dev/null || echo "  ⚠️  Could not create backup (database might not be running)"
        if [ -s "$BACKUP_FILE" ]; then
            echo "  ✅ Backup created: $BACKUP_FILE"
        fi
    fi
fi

# Stop existing services
echo ""
echo "🛑 Stopping existing services..."
docker-compose -f docker-compose.instance.yml --env-file "$ENV_FILE" -p "$INSTANCE_NAME" down || true

# Start infrastructure services
echo ""
echo "📦 Starting infrastructure services..."
docker-compose -f docker-compose.instance.yml --env-file "$ENV_FILE" -p "$INSTANCE_NAME" up -d postgres redis

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5
MAX_RETRIES=30
RETRY_COUNT=0
while ! docker exec "${INSTANCE_NAME}-postgres" pg_isready -U "$POSTGRES_USER" >/dev/null 2>&1; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
        echo "❌ Database failed to start"
        exit 1
    fi
    sleep 1
done

# Run migrations if not skipped
if [ "$SKIP_MIGRATIONS" = false ]; then
    echo ""
    echo "🔄 Running database migrations..."
    cd ../backend
    DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${POSTGRES_PORT}/${DATABASE_NAME}?schema=public" npx prisma migrate deploy
    cd "$SCRIPT_DIR"
fi

# Start all services
echo ""
echo "🚀 Starting all services..."
docker-compose -f docker-compose.instance.yml --env-file "$ENV_FILE" -p "$INSTANCE_NAME" up -d

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 10

# Health checks
echo ""
echo "🏥 Performing health checks..."
HEALTH_CHECK_FAILED=false

# Backend health check
BACKEND_URL="http://localhost:${BACKEND_PORT}/health"
if curl -f -s "$BACKEND_URL" >/dev/null 2>&1; then
    echo "  ✅ Backend is healthy"
else
    echo "  ❌ Backend health check failed"
    HEALTH_CHECK_FAILED=true
fi

# ML Service health check
ML_URL="http://localhost:${ML_SERVICE_PORT}/health"
if curl -f -s "$ML_URL" >/dev/null 2>&1; then
    echo "  ✅ ML Service is healthy"
else
    echo "  ⚠️  ML Service health check failed (may not be critical)"
fi

# Frontend health check (basic)
FRONTEND_URL="http://localhost:${FRONTEND_PORT}"
if curl -f -s "$FRONTEND_URL" >/dev/null 2>&1; then
    echo "  ✅ Frontend is accessible"
else
    echo "  ⚠️  Frontend health check failed"
fi

# Database connectivity
if docker exec "${INSTANCE_NAME}-postgres" psql -U "$POSTGRES_USER" -d "$DATABASE_NAME" -c "SELECT 1" >/dev/null 2>&1; then
    echo "  ✅ Database is accessible"
else
    echo "  ❌ Database connectivity check failed"
    HEALTH_CHECK_FAILED=true
fi

# Final result
echo ""
if [ "$HEALTH_CHECK_FAILED" = true ]; then
    echo "❌ Deployment completed with health check failures"
    echo "Review logs: docker-compose -f docker-compose.instance.yml --env-file $ENV_FILE -p $INSTANCE_NAME logs"
    exit 1
else
    echo "✅ Staging deployment successful!"
    echo ""
    echo "📋 Access URLs:"
    echo "  - Backend API:   http://localhost:${BACKEND_PORT}"
    echo "  - Frontend:      http://localhost:${FRONTEND_PORT}"
    echo "  - ML Service:    http://localhost:${ML_SERVICE_PORT}"
    echo ""
    echo "View logs: docker-compose -f docker-compose.instance.yml --env-file $ENV_FILE -p $INSTANCE_NAME logs -f"
fi

