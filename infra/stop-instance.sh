#!/bin/bash
# Stop an isolated ConstIntel instance
# Usage: ./stop-instance.sh <instance-name>
# Example: ./stop-instance.sh dev

set -e

if [ "$#" -lt 1 ]; then
    echo "Usage: $0 <instance-name>"
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

echo "Stopping instance: $INSTANCE_NAME"

docker-compose -f docker-compose.instance.yml --env-file "$ENV_FILE" -p "$INSTANCE_NAME" down

echo "✅ Instance '$INSTANCE_NAME' stopped"

