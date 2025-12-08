#!/bin/bash
# Deploy to Production Environment
# Builds Docker images, backs up database, runs migrations, deploys services
# HOW TO USE: ./deploy-production.sh [--skip-tests] [--skip-backup]
# WARNING: Production deployments require confirmation

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

INSTANCE_NAME="production"
INSTANCE_DIR="instances/$INSTANCE_NAME"
ENV_FILE="$INSTANCE_DIR/.env"

# Check if production instance exists
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: Production instance not found"
    echo "Create it first with: ./setup-production.sh"
    exit 1
fi

# Parse arguments
SKIP_TESTS=false
SKIP_BACKUP=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-backup)
            SKIP_BACKUP=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

echo "⚠️  PRODUCTION DEPLOYMENT"
echo "========================"
echo ""
echo "This will deploy to PRODUCTION environment:"
echo "  - Instance: $INSTANCE_NAME"
echo "  - All services will be restarted"
echo "  - Database migrations will be run"
echo "  - Zero-downtime deployment will be attempted"
echo ""
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Deployment cancelled."
    exit 0
fi

echo ""
echo "🚀 Starting Production Deployment..."
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
        npm test 2>&1 | grep -E "(PASS|FAIL|Tests:)" || {
            echo "  ❌ Backend tests failed!"
            read -p "Continue anyway? (yes/no): " CONTINUE
            if [ "$CONTINUE" != "yes" ]; then
                echo "Deployment cancelled due to test failures."
                exit 1
            fi
        }
        cd "$SCRIPT_DIR"
    fi
fi

# Full database backup (mandatory unless skipped)
if [ "$SKIP_BACKUP" = false ]; then
    echo ""
    echo "💾 Creating full database backup..."
    BACKUP_DIR="$INSTANCE_DIR/backups"
    mkdir -p "$BACKUP_DIR"
    BACKUP_FILE="$BACKUP_DIR/pre-deployment-$(date +%Y%m%d-%H%M%S).sql"
    
    if docker ps --format '{{.Names}}' | grep -q "^${INSTANCE_NAME}-postgres"; then
        echo "  Backing up database to: $BACKUP_FILE"
        docker exec "${INSTANCE_NAME}-postgres" pg_dump -U "$POSTGRES_USER" -F c -f "/tmp/prod_backup.dump" "$DATABASE_NAME" 2>/dev/null
        docker cp "${INSTANCE_NAME}-postgres:/tmp/prod_backup.dump" "$BACKUP_FILE"
        docker exec "${INSTANCE_NAME}-postgres" rm -f /tmp/prod_backup.dump
        
        if [ -f "$BACKUP_FILE" ] && [ -s "$BACKUP_FILE" ]; then
            echo "  ✅ Backup created: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"
        else
            echo "  ❌ Backup failed or is empty!"
            read -p "Continue anyway? (yes/no): " CONTINUE
            if [ "$CONTINUE" != "yes" ]; then
                echo "Deployment cancelled due to backup failure."
                exit 1
            fi
        fi
    else
        echo "  ⚠️  Database container not running - cannot create backup"
        read -p "Continue anyway? (yes/no): " CONTINUE
        if [ "$CONTINUE" != "yes" ]; then
            echo "Deployment cancelled."
            exit 1
        fi
    fi
fi

# Build Docker images
echo ""
echo "🔨 Building Docker images..."
docker-compose -f docker-compose.instance.yml --env-file "$ENV_FILE" -p "$INSTANCE_NAME" build

# Zero-downtime deployment strategy
echo ""
echo "🔄 Starting zero-downtime deployment..."

# Start infrastructure if not running
if ! docker ps --format '{{.Names}}' | grep -q "^${INSTANCE_NAME}-postgres"; then
    echo "  Starting infrastructure services..."
    docker-compose -f docker-compose.instance.yml --env-file "$ENV_FILE" -p "$INSTANCE_NAME" up -d postgres redis
    
    # Wait for database
    echo "  Waiting for database..."
    sleep 5
    MAX_RETRIES=30
    RETRY_COUNT=0
    while ! docker exec "${INSTANCE_NAME}-postgres" pg_isready -U "$POSTGRES_USER" >/dev/null 2>&1; do
        RETRY_COUNT=$((RETRY_COUNT + 1))
        if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
            echo "  ❌ Database failed to start"
            exit 1
        fi
        sleep 1
    done
fi

# Run migrations
echo ""
echo "🔄 Running database migrations..."
cd ../backend
DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${POSTGRES_PORT}/${DATABASE_NAME}?schema=public" npx prisma migrate deploy
cd "$SCRIPT_DIR"

# Deploy services with zero-downtime
echo ""
echo "🚀 Deploying services..."

# Deploy backend first (it's the most critical)
docker-compose -f docker-compose.instance.yml --env-file "$ENV_FILE" -p "$INSTANCE_NAME" up -d backend

# Wait for backend to be healthy
echo "  Waiting for backend to be healthy..."
sleep 5
MAX_RETRIES=20
RETRY_COUNT=0
while ! curl -f -s "http://localhost:${BACKEND_PORT}/health" >/dev/null 2>&1; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
        echo "  ❌ Backend failed health check - rolling back!"
        ./rollback.sh production
        exit 1
    fi
    sleep 2
done

# Deploy ML service
docker-compose -f docker-compose.instance.yml --env-file "$ENV_FILE" -p "$INSTANCE_NAME" up -d ml-service
sleep 3

# Deploy frontend last
docker-compose -f docker-compose.instance.yml --env-file "$ENV_FILE" -p "$INSTANCE_NAME" up -d frontend
sleep 3

# Deploy workers
docker-compose -f docker-compose.instance.yml --env-file "$ENV_FILE" -p "$INSTANCE_NAME" up -d event-worker automation-worker

# Comprehensive health checks
echo ""
echo "🏥 Performing comprehensive health checks..."
HEALTH_CHECK_FAILED=false

# Backend health
BACKEND_URL="http://localhost:${BACKEND_PORT}/health"
if curl -f -s "$BACKEND_URL" >/dev/null 2>&1; then
    echo "  ✅ Backend is healthy"
else
    echo "  ❌ Backend health check failed"
    HEALTH_CHECK_FAILED=true
fi

# ML Service health
ML_URL="http://localhost:${ML_SERVICE_PORT}/health"
if curl -f -s "$ML_URL" >/dev/null 2>&1; then
    echo "  ✅ ML Service is healthy"
else
    echo "  ⚠️  ML Service health check failed"
fi

# Database connectivity
if docker exec "${INSTANCE_NAME}-postgres" psql -U "$POSTGRES_USER" -d "$DATABASE_NAME" -c "SELECT 1" >/dev/null 2>&1; then
    echo "  ✅ Database is accessible"
else
    echo "  ❌ Database connectivity failed"
    HEALTH_CHECK_FAILED=true
fi

# Final result
echo ""
if [ "$HEALTH_CHECK_FAILED" = true ]; then
    echo "❌ Production deployment completed with health check failures!"
    echo "Consider rolling back: ./rollback.sh production"
    exit 1
else
    echo "✅ Production deployment successful!"
    echo ""
    echo "📋 Access URLs:"
    echo "  - Backend API:   http://localhost:${BACKEND_PORT}"
    echo "  - Frontend:      http://localhost:${FRONTEND_PORT}"
    echo "  - ML Service:    http://localhost:${ML_SERVICE_PORT}"
    echo ""
    echo "⚠️  Monitor the application closely for the next few minutes!"
    echo "View logs: docker-compose -f docker-compose.instance.yml --env-file $ENV_FILE -p $INSTANCE_NAME logs -f"
fi

