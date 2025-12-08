#!/bin/bash
# Start an isolated ConstIntel instance
# Usage: ./start-instance.sh <instance-name>
# Example: ./start-instance.sh dev

set -e

if [ "$#" -lt 1 ]; then
    echo "Usage: $0 <instance-name>"
    echo ""
    echo "Available instances:"
    if [ -d "instances" ]; then
        for dir in instances/*/; do
            if [ -f "${dir}.env" ]; then
                INSTANCE=$(basename "$dir")
                echo "  - $INSTANCE"
            fi
        done
    else
        echo "  (no instances found)"
    fi
    exit 1
fi

INSTANCE_NAME=$1
INSTANCE_DIR="instances/$INSTANCE_NAME"
ENV_FILE="$INSTANCE_DIR/.env"

# Check if instance exists
if [ ! -f "$ENV_FILE" ]; then
    echo "Error: Instance '$INSTANCE_NAME' not found"
    echo "Create it first with: ./create-instance.sh $INSTANCE_NAME <instance-id>"
    exit 1
fi

# Source environment variables
export $(grep -v '^#' "$ENV_FILE" | xargs)

echo "Starting instance: $INSTANCE_NAME"

# Check if instance is already running
if docker ps --format '{{.Names}}' | grep -q "^${INSTANCE_NAME}-"; then
    echo "Warning: Some containers for instance '$INSTANCE_NAME' are already running"
    echo "Stopping existing containers..."
    docker-compose -f docker-compose.instance.yml --env-file "$ENV_FILE" -p "$INSTANCE_NAME" down
fi

# Start infrastructure services first
echo "Starting infrastructure (Postgres, Redis)..."
docker-compose -f docker-compose.instance.yml --env-file "$ENV_FILE" -p "$INSTANCE_NAME" up -d postgres redis

# Wait for services to be healthy
echo "Waiting for services to be ready..."
sleep 5

# Run migrations if database is empty
if ! docker exec "${INSTANCE_NAME}-postgres" psql -U "$POSTGRES_USER" -d "$DATABASE_NAME" -c "\dt" 2>/dev/null | grep -q "customer_profile"; then
    echo "Database is empty, running migrations..."
    
    # Run migrations from host (not inside container due to OpenSSL issues)
    cd ../backend
    DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${POSTGRES_PORT}/${DATABASE_NAME}?schema=public" npx prisma db push 2>&1 | grep -E "(CREATE|CREATE INDEX|ALTER)" || true
    cd ../infra
fi

# Start all services
echo "Starting all services..."
docker-compose -f docker-compose.instance.yml --env-file "$ENV_FILE" -p "$INSTANCE_NAME" up -d

echo ""
echo "✅ Instance '$INSTANCE_NAME' started!"
echo ""
echo "Services:"
echo "  - Backend API:   http://localhost:${BACKEND_PORT}"
echo "  - Frontend:      http://localhost:${FRONTEND_PORT}"
echo "  - ML Service:    http://localhost:${ML_SERVICE_PORT}"
echo "  - PostgreSQL:    localhost:${POSTGRES_PORT}"
echo "  - Redis:         localhost:${REDIS_PORT}"
echo ""
echo "View logs: docker-compose -f docker-compose.instance.yml --env-file $ENV_FILE -p $INSTANCE_NAME logs -f"
echo "Stop: ./stop-instance.sh $INSTANCE_NAME"

