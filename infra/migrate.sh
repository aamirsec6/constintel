#!/bin/bash
# Run database migrations for an instance
# Usage: ./migrate.sh <instance-name> [--backup]
# Example: ./migrate.sh staging --backup

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [ "$#" -lt 1 ]; then
    echo "Usage: $0 <instance-name> [--backup]"
    echo ""
    echo "Available instances:"
    if [ -d "instances" ]; then
        for dir in instances/*/; do
            if [ -f "${dir}.env" ]; then
                INSTANCE=$(basename "$dir")
                echo "  - $INSTANCE"
            fi
        done
    fi
    exit 1
fi

INSTANCE_NAME=$1
INSTANCE_DIR="instances/$INSTANCE_NAME"
ENV_FILE="$INSTANCE_DIR/.env"
CREATE_BACKUP=false

# Check for backup flag
if [ "$2" = "--backup" ]; then
    CREATE_BACKUP=true
fi

# Check if instance exists
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: Instance '$INSTANCE_NAME' not found"
    exit 1
fi

# Source environment variables
export $(grep -v '^#' "$ENV_FILE" | xargs)

echo "🔄 Running database migrations for: $INSTANCE_NAME"
echo ""

# Create backup if requested
if [ "$CREATE_BACKUP" = true ]; then
    echo "💾 Creating database backup before migration..."
    BACKUP_DIR="$INSTANCE_DIR/backups"
    mkdir -p "$BACKUP_DIR"
    BACKUP_FILE="$BACKUP_DIR/pre-migration-$(date +%Y%m%d-%H%M%S).sql"
    
    if docker ps --format '{{.Names}}' | grep -q "^${INSTANCE_NAME}-postgres"; then
        docker exec "${INSTANCE_NAME}-postgres" pg_dump -U "$POSTGRES_USER" -F c -f "/tmp/migration_backup.dump" "$DATABASE_NAME" 2>/dev/null
        docker cp "${INSTANCE_NAME}-postgres:/tmp/migration_backup.dump" "$BACKUP_FILE"
        docker exec "${INSTANCE_NAME}-postgres" rm -f /tmp/migration_backup.dump
        
        if [ -f "$BACKUP_FILE" ] && [ -s "$BACKUP_FILE" ]; then
            echo "  ✅ Backup created: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"
        else
            echo "  ⚠️  Backup failed or is empty"
        fi
    else
        echo "  ⚠️  Database container not running - skipping backup"
    fi
    echo ""
fi

# Ensure database is running
if ! docker ps --format '{{.Names}}' | grep -q "^${INSTANCE_NAME}-postgres"; then
    echo "❌ Error: Database container '${INSTANCE_NAME}-postgres' is not running"
    echo "Start the instance first: ./start-instance.sh $INSTANCE_NAME"
    exit 1
fi

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
MAX_RETRIES=30
RETRY_COUNT=0
while ! docker exec "${INSTANCE_NAME}-postgres" pg_isready -U "$POSTGRES_USER" >/dev/null 2>&1; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
        echo "❌ Database failed to become ready"
        exit 1
    fi
    sleep 1
done

# Run migrations
echo "🔄 Running Prisma migrations..."
cd ../backend

DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${POSTGRES_PORT}/${DATABASE_NAME}?schema=public"

# For production, use migrate deploy (no new migrations)
# For staging/dev, use migrate deploy (applies pending migrations)
if [ "$NODE_ENV" = "production" ]; then
    echo "  Using production migration strategy (migrate deploy)..."
    npx prisma migrate deploy
else
    echo "  Using staging/dev migration strategy (migrate deploy)..."
    npx prisma migrate deploy
fi

cd "$SCRIPT_DIR"

echo ""
echo "✅ Migrations completed successfully!"
echo ""
echo "Verify migration status:"
echo "  docker exec ${INSTANCE_NAME}-postgres psql -U $POSTGRES_USER -d $DATABASE_NAME -c \"SELECT * FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5;\""

