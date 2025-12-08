#!/bin/bash
# Remove an isolated ConstIntel instance (including data)
# Usage: ./remove-instance.sh <instance-name>
# Example: ./remove-instance.sh dev
#
# WARNING: This will permanently delete all data for this instance!

set -e

if [ "$#" -lt 1 ]; then
    echo "Usage: $0 <instance-name>"
    echo ""
    echo "WARNING: This will permanently delete the instance and all its data!"
    exit 1
fi

INSTANCE_NAME=$1
INSTANCE_DIR="instances/$INSTANCE_NAME"
ENV_FILE="$INSTANCE_DIR/.env"

# Check if instance exists
if [ ! -f "$ENV_FILE" ]; then
    echo "Error: Instance '$INSTANCE_NAME' not found"
    exit 1
fi

# Confirm deletion
echo "WARNING: This will permanently delete instance '$INSTANCE_NAME' and all its data!"
echo ""
read -p "Are you sure? Type 'yes' to confirm: " confirm

if [ "$confirm" != "yes" ]; then
    echo "Cancelled."
    exit 0
fi

# Stop and remove containers first
echo "Stopping containers..."
docker-compose -f docker-compose.instance.yml --env-file "$ENV_FILE" -p "$INSTANCE_NAME" down -v 2>/dev/null || true

# Remove volumes
echo "Removing volumes..."
docker volume rm "${INSTANCE_NAME}_postgres_data" "${INSTANCE_NAME}_redis_data" "${INSTANCE_NAME}_ml_models" 2>/dev/null || true

# Remove network
echo "Removing network..."
docker network rm "${INSTANCE_NAME}_network" 2>/dev/null || true

# Remove instance directory
echo "Removing instance directory..."
rm -rf "$INSTANCE_DIR"

echo "✅ Instance '$INSTANCE_NAME' removed successfully"

