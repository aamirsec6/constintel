#!/bin/bash
# List all isolated ConstIntel instances and their status
# Usage: ./list-instances.sh

echo "ConstIntel Instances"
echo "==================="
echo ""

if [ ! -d "instances" ] || [ -z "$(ls -A instances 2>/dev/null)" ]; then
    echo "No instances found."
    echo ""
    echo "Create an instance with: ./create-instance.sh <name> <id>"
    exit 0
fi

printf "%-20s %-10s %-15s %-15s %-15s\n" "INSTANCE" "ID" "BACKEND" "FRONTEND" "STATUS"
printf "%-20s %-10s %-15s %-15s %-15s\n" "--------" "--" "-------" "--------" "------"

for dir in instances/*/; do
    if [ -f "${dir}.env" ]; then
        INSTANCE=$(basename "$dir")
        ENV_FILE="${dir}.env"
        
        # Source environment variables
        INSTANCE_ID=$(grep "^INSTANCE_ID=" "$ENV_FILE" | cut -d'=' -f2 | tr -d ' ')
        BACKEND_PORT=$(grep "^BACKEND_PORT=" "$ENV_FILE" | cut -d'=' -f2 | tr -d ' ')
        FRONTEND_PORT=$(grep "^FRONTEND_PORT=" "$ENV_FILE" | cut -d'=' -f2 | tr -d ' ')
        
        # Check if any containers are running
        if docker ps --format '{{.Names}}' | grep -q "^${INSTANCE}-"; then
            STATUS="RUNNING"
        else
            STATUS="STOPPED"
        fi
        
        printf "%-20s %-10s %-15s %-15s %-15s\n" "$INSTANCE" "$INSTANCE_ID" ":$BACKEND_PORT" ":$FRONTEND_PORT" "$STATUS"
    fi
done

echo ""
echo "Commands:"
echo "  Start:   ./start-instance.sh <name>"
echo "  Stop:    ./stop-instance.sh <name>"
echo "  Remove:  ./remove-instance.sh <name>"

