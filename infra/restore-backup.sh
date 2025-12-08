#!/bin/bash
# Restore database from backup
# Usage: ./restore-backup.sh <instance-name> <backup-file>
# Example: ./restore-backup.sh production backups/daily-backup.dump
# WARNING: This will overwrite the existing database!

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [ "$#" -lt 2 ]; then
    echo "Usage: $0 <instance-name> <backup-file>"
    echo ""
    echo "Example:"
    echo "  $0 production backups/daily-backup.dump"
    echo "  $0 staging instances/staging/backups/pre-migration-20241203-120000.dump"
    exit 1
fi

INSTANCE_NAME=$1
BACKUP_FILE=$2
INSTANCE_DIR="instances/$INSTANCE_NAME"
ENV_FILE="$INSTANCE_DIR/.env"

# Check if instance exists
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: Instance '$INSTANCE_NAME' not found"
    exit 1
fi

# Resolve backup file path
if [ ! -f "$BACKUP_FILE" ]; then
    # Try relative to instance directory
    BACKUP_FILE="$INSTANCE_DIR/$BACKUP_FILE"
    if [ ! -f "$BACKUP_FILE" ]; then
        echo "❌ Error: Backup file not found: $BACKUP_FILE"
        exit 1
    fi
fi

# Source environment variables
export $(grep -v '^#' "$ENV_FILE" | xargs)

echo "⚠️  DATABASE RESTORE"
echo "==================="
echo ""
echo "Instance: $INSTANCE_NAME"
echo "Backup file: $BACKUP_FILE"
echo "Database: $DATABASE_NAME"
echo ""
echo "⚠️  WARNING: This will OVERWRITE the existing database!"
echo "All current data will be lost!"
echo ""
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
fi

# Check if database container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${INSTANCE_NAME}-postgres"; then
    echo "❌ Error: Database container '${INSTANCE_NAME}-postgres' is not running"
    echo "Start the instance first: ./start-instance.sh $INSTANCE_NAME"
    exit 1
fi

# Create a backup before restore (safety)
echo ""
echo "💾 Creating safety backup before restore..."
SAFETY_BACKUP="$INSTANCE_DIR/backups/pre-restore-$(date +%Y%m%d-%H%M%S).dump"
mkdir -p "$(dirname "$SAFETY_BACKUP")"

docker exec "${INSTANCE_NAME}-postgres" pg_dump -U "$POSTGRES_USER" -F c -f "/tmp/safety_backup.dump" "$DATABASE_NAME" 2>/dev/null || echo "  ⚠️  Could not create safety backup (database might be empty)"
if docker cp "${INSTANCE_NAME}-postgres:/tmp/safety_backup.dump" "$SAFETY_BACKUP" 2>/dev/null; then
    docker exec "${INSTANCE_NAME}-postgres" rm -f /tmp/safety_backup.dump
    echo "  ✅ Safety backup created: $SAFETY_BACKUP"
fi

# Stop services that use the database
echo ""
echo "🛑 Stopping services that use the database..."
docker-compose -f docker-compose.instance.yml --env-file "$ENV_FILE" -p "$INSTANCE_NAME" stop backend ml-service event-worker automation-worker || true

# Drop and recreate database
echo ""
echo "🗑️  Dropping existing database..."
docker exec "${INSTANCE_NAME}-postgres" psql -U "$POSTGRES_USER" -c "DROP DATABASE IF EXISTS ${DATABASE_NAME};" postgres
docker exec "${INSTANCE_NAME}-postgres" psql -U "$POSTGRES_USER" -c "CREATE DATABASE ${DATABASE_NAME};" postgres

# Restore backup
echo ""
echo "📦 Restoring backup..."
docker cp "$BACKUP_FILE" "${INSTANCE_NAME}-postgres:/tmp/restore.dump"
docker exec "${INSTANCE_NAME}-postgres" pg_restore -U "$POSTGRES_USER" -d "$DATABASE_NAME" --no-owner --no-privileges /tmp/restore.dump
docker exec "${INSTANCE_NAME}-postgres" rm -f /tmp/restore.dump

# Verify restore
echo ""
echo "✅ Verifying restore..."
TABLE_COUNT=$(docker exec "${INSTANCE_NAME}-postgres" psql -U "$POSTGRES_USER" -d "$DATABASE_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')

if [ "$TABLE_COUNT" -gt "0" ]; then
    echo "  ✅ Restore successful! Found $TABLE_COUNT tables."
else
    echo "  ⚠️  Warning: No tables found after restore"
fi

# Restart services
echo ""
echo "🚀 Restarting services..."
docker-compose -f docker-compose.instance.yml --env-file "$ENV_FILE" -p "$INSTANCE_NAME" up -d

echo ""
echo "✅ Database restore completed!"
echo ""
echo "Services have been restarted. Verify that everything is working correctly."

