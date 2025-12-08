#!/bin/bash
# Backup database for an instance
# Usage: ./backup-database.sh <instance-name> [backup-name]
# Example: ./backup-database.sh production daily-backup

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [ "$#" -lt 1 ]; then
    echo "Usage: $0 <instance-name> [backup-name]"
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
BACKUP_NAME=${2:-"manual-$(date +%Y%m%d-%H%M%S)"}
INSTANCE_DIR="instances/$INSTANCE_NAME"
ENV_FILE="$INSTANCE_DIR/.env"

# Check if instance exists
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: Instance '$INSTANCE_NAME' not found"
    exit 1
fi

# Source environment variables
export $(grep -v '^#' "$ENV_FILE" | xargs)

BACKUP_DIR="$INSTANCE_DIR/backups"
mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/${BACKUP_NAME}.dump"

echo "💾 Creating database backup for: $INSTANCE_NAME"
echo ""

# Check if database container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${INSTANCE_NAME}-postgres"; then
    echo "❌ Error: Database container '${INSTANCE_NAME}-postgres' is not running"
    exit 1
fi

# Create backup
echo "  Backing up database: $DATABASE_NAME"
echo "  Backup file: $BACKUP_FILE"

docker exec "${INSTANCE_NAME}-postgres" pg_dump -U "$POSTGRES_USER" -F c -f "/tmp/backup.dump" "$DATABASE_NAME"
docker cp "${INSTANCE_NAME}-postgres:/tmp/backup.dump" "$BACKUP_FILE"
docker exec "${INSTANCE_NAME}-postgres" rm -f /tmp/backup.dump

if [ -f "$BACKUP_FILE" ] && [ -s "$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo ""
    echo "✅ Backup created successfully!"
    echo "  File: $BACKUP_FILE"
    echo "  Size: $BACKUP_SIZE"
    echo ""
    echo "To restore this backup, use:"
    echo "  ./restore-backup.sh $INSTANCE_NAME $BACKUP_FILE"
else
    echo "❌ Backup failed or is empty"
    exit 1
fi

