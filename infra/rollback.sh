#!/bin/bash
# Rollback deployment to previous version
# Usage: ./rollback.sh <instance-name> [backup-file]
# Example: ./rollback.sh production
# Example: ./rollback.sh staging backups/pre-deployment-20241203-120000.dump

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [ "$#" -lt 1 ]; then
    echo "Usage: $0 <instance-name> [backup-file]"
    echo ""
    echo "If backup-file is not specified, will use the most recent backup"
    exit 1
fi

INSTANCE_NAME=$1
INSTANCE_DIR="instances/$INSTANCE_NAME"
ENV_FILE="$INSTANCE_DIR/.env"
BACKUP_DIR="$INSTANCE_DIR/backups"

# Check if instance exists
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: Instance '$INSTANCE_NAME' not found"
    exit 1
fi

# Source environment variables
export $(grep -v '^#' "$ENV_FILE" | xargs)

echo "⚠️  ROLLBACK DEPLOYMENT"
echo "======================"
echo ""
echo "Instance: $INSTANCE_NAME"

# Determine backup file
if [ -n "$2" ]; then
    BACKUP_FILE="$2"
    if [ ! -f "$BACKUP_FILE" ]; then
        BACKUP_FILE="$BACKUP_DIR/$2"
    fi
else
    # Find most recent backup
    if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A "$BACKUP_DIR" 2>/dev/null)" ]; then
        echo "❌ Error: No backups found in $BACKUP_DIR"
        echo "Cannot rollback without a backup."
        exit 1
    fi
    
    BACKUP_FILE=$(ls -t "$BACKUP_DIR"/*.dump 2>/dev/null | head -1)
    if [ -z "$BACKUP_FILE" ]; then
        echo "❌ Error: No backup files (.dump) found in $BACKUP_DIR"
        exit 1
    fi
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "Backup file: $BACKUP_FILE"
BACKUP_DATE=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$BACKUP_FILE" 2>/dev/null || stat -c "%y" "$BACKUP_FILE" 2>/dev/null | cut -d. -f1)
echo "Backup date: $BACKUP_DATE"
echo ""
echo "⚠️  WARNING: This will restore the database from backup!"
echo "Current database state will be lost!"
echo ""
read -p "Are you sure you want to rollback? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Rollback cancelled."
    exit 0
fi

# Stop services
echo ""
echo "🛑 Stopping services..."
docker-compose -f docker-compose.instance.yml --env-file "$ENV_FILE" -p "$INSTANCE_NAME" stop backend ml-service event-worker automation-worker

# Restore backup using restore script
echo ""
echo "📦 Restoring backup..."
"$SCRIPT_DIR/restore-backup.sh" "$INSTANCE_NAME" "$BACKUP_FILE"

# Note: restore-backup.sh already restarts services, so we're done
echo ""
echo "✅ Rollback completed!"
echo ""
echo "⚠️  Important:"
echo "  - Verify the application is working correctly"
echo "  - Check logs: docker-compose -f docker-compose.instance.yml --env-file $ENV_FILE -p $INSTANCE_NAME logs -f"
echo "  - Monitor for any issues"

