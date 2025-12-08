#!/bin/bash
# Health check script for an instance
# Usage: ./health-check.sh <instance-name>
# Example: ./health-check.sh staging

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [ "$#" -lt 1 ]; then
    echo "Usage: $0 <instance-name>"
    exit 1
fi

INSTANCE_NAME=$1
INSTANCE_DIR="instances/$INSTANCE_NAME"
ENV_FILE="$INSTANCE_DIR/.env"

# Check if instance exists
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: Instance '$INSTANCE_NAME' not found"
    exit 1
fi

# Source environment variables
export $(grep -v '^#' "$ENV_FILE" | xargs)

echo "🏥 Health Check for: $INSTANCE_NAME"
echo "===================================="
echo ""

HEALTHY=true

# Check PostgreSQL
echo "📊 PostgreSQL:"
if docker ps --format '{{.Names}}' | grep -q "^${INSTANCE_NAME}-postgres"; then
    if docker exec "${INSTANCE_NAME}-postgres" pg_isready -U "$POSTGRES_USER" >/dev/null 2>&1; then
        echo "  ✅ Container is running and ready"
        
        # Check database connection
        if docker exec "${INSTANCE_NAME}-postgres" psql -U "$POSTGRES_USER" -d "$DATABASE_NAME" -c "SELECT 1" >/dev/null 2>&1; then
            echo "  ✅ Database connection successful"
            
            # Get database size
            DB_SIZE=$(docker exec "${INSTANCE_NAME}-postgres" psql -U "$POSTGRES_USER" -d "$DATABASE_NAME" -t -c "SELECT pg_size_pretty(pg_database_size('$DATABASE_NAME'));" | tr -d ' ')
            echo "  📦 Database size: $DB_SIZE"
        else
            echo "  ❌ Database connection failed"
            HEALTHY=false
        fi
    else
        echo "  ❌ Container is running but not ready"
        HEALTHY=false
    fi
else
    echo "  ❌ Container is not running"
    HEALTHY=false
fi
echo ""

# Check Redis
echo "📊 Redis:"
if docker ps --format '{{.Names}}' | grep -q "^${INSTANCE_NAME}-redis"; then
    if docker exec "${INSTANCE_NAME}-redis" redis-cli ping >/dev/null 2>&1; then
        echo "  ✅ Container is running and responding"
        
        # Get Redis info
        REDIS_INFO=$(docker exec "${INSTANCE_NAME}-redis" redis-cli info server 2>/dev/null | grep redis_version || echo "")
        if [ -n "$REDIS_INFO" ]; then
            REDIS_VERSION=$(echo "$REDIS_INFO" | cut -d: -f2 | tr -d '\r')
            echo "  🔢 Version: $REDIS_VERSION"
        fi
    else
        echo "  ❌ Container is running but not responding"
        HEALTHY=false
    fi
else
    echo "  ❌ Container is not running"
    HEALTHY=false
fi
echo ""

# Check Backend
echo "📊 Backend API:"
if docker ps --format '{{.Names}}' | grep -q "^${INSTANCE_NAME}-backend"; then
    BACKEND_URL="http://localhost:${BACKEND_PORT}/health"
    if curl -f -s "$BACKEND_URL" >/dev/null 2>&1; then
        echo "  ✅ Container is running and healthy"
        RESPONSE_TIME=$(curl -o /dev/null -s -w "%{time_total}" "$BACKEND_URL" 2>/dev/null || echo "N/A")
        echo "  ⚡ Response time: ${RESPONSE_TIME}s"
    else
        echo "  ❌ Container is running but health check failed"
        HEALTHY=false
    fi
else
    echo "  ❌ Container is not running"
    HEALTHY=false
fi
echo ""

# Check ML Service
echo "📊 ML Service:"
if docker ps --format '{{.Names}}' | grep -q "^${INSTANCE_NAME}-ml-service"; then
    ML_URL="http://localhost:${ML_SERVICE_PORT}/health"
    if curl -f -s "$ML_URL" >/dev/null 2>&1; then
        echo "  ✅ Container is running and healthy"
    else
        echo "  ⚠️  Container is running but health check failed (may not be critical)"
    fi
else
    echo "  ⚠️  Container is not running"
fi
echo ""

# Check Frontend
echo "📊 Frontend:"
if docker ps --format '{{.Names}}' | grep -q "^${INSTANCE_NAME}-frontend"; then
    FRONTEND_URL="http://localhost:${FRONTEND_PORT}"
    if curl -f -s "$FRONTEND_URL" >/dev/null 2>&1; then
        echo "  ✅ Container is running and accessible"
    else
        echo "  ⚠️  Container is running but not accessible"
    fi
else
    echo "  ⚠️  Container is not running"
fi
echo ""

# Check Workers
echo "📊 Workers:"
EVENT_WORKER_RUNNING=$(docker ps --format '{{.Names}}' | grep -q "^${INSTANCE_NAME}-event-worker" && echo "yes" || echo "no")
AUTOMATION_WORKER_RUNNING=$(docker ps --format '{{.Names}}' | grep -q "^${INSTANCE_NAME}-automation-worker" && echo "yes" || echo "no")

if [ "$EVENT_WORKER_RUNNING" = "yes" ]; then
    echo "  ✅ Event worker is running"
else
    echo "  ⚠️  Event worker is not running"
fi

if [ "$AUTOMATION_WORKER_RUNNING" = "yes" ]; then
    echo "  ✅ Automation worker is running"
else
    echo "  ⚠️  Automation worker is not running"
fi
echo ""

# Disk space check
echo "📊 Disk Space:"
DISK_USAGE=$(df -h "$INSTANCE_DIR" | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 80 ]; then
    echo "  ✅ Disk usage: ${DISK_USAGE}%"
elif [ "$DISK_USAGE" -lt 90 ]; then
    echo "  ⚠️  Disk usage: ${DISK_USAGE}% (getting high)"
else
    echo "  ❌ Disk usage: ${DISK_USAGE}% (critical!)"
    HEALTHY=false
fi
echo ""

# Final status
echo "===================================="
if [ "$HEALTHY" = true ]; then
    echo "✅ Overall Health: HEALTHY"
    exit 0
else
    echo "❌ Overall Health: UNHEALTHY"
    echo ""
    echo "Review logs:"
    echo "  docker-compose -f docker-compose.instance.yml --env-file $ENV_FILE -p $INSTANCE_NAME logs"
    exit 1
fi

