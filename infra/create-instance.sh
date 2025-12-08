#!/bin/bash
# Create a new isolated ConstIntel instance
# Usage: ./create-instance.sh <instance-name> <instance-id>
# Example: ./create-instance.sh dev 0
# Example: ./create-instance.sh staging 1
# Example: ./create-instance.sh prod 2

set -e

if [ "$#" -lt 2 ]; then
    echo "Usage: $0 <instance-name> <instance-id>"
    echo ""
    echo "Examples:"
    echo "  $0 dev 0      # Creates 'dev' instance with ID 0 (ports: 3000, 3001, 8000, 5432, 6379)"
    echo "  $0 staging 1  # Creates 'staging' instance with ID 1 (ports: 3010, 3011, 8010, 5433, 6380)"
    echo "  $0 prod 2     # Creates 'prod' instance with ID 2 (ports: 3020, 3021, 8020, 5434, 6381)"
    exit 1
fi

INSTANCE_NAME=$1
INSTANCE_ID=$2

# Validate instance name (alphanumeric and hyphens only)
if ! [[ "$INSTANCE_NAME" =~ ^[a-z0-9-]+$ ]]; then
    echo "Error: Instance name must be lowercase alphanumeric with hyphens only"
    exit 1
fi

# Validate instance ID (numeric)
if ! [[ "$INSTANCE_ID" =~ ^[0-9]+$ ]]; then
    echo "Error: Instance ID must be numeric"
    exit 1
fi

INSTANCE_DIR="instances/$INSTANCE_NAME"
ENV_FILE="$INSTANCE_DIR/.env"

# Check if instance already exists
if [ -d "$INSTANCE_DIR" ]; then
    echo "Error: Instance '$INSTANCE_NAME' already exists at $INSTANCE_DIR"
    echo "To recreate, first remove it with: ./remove-instance.sh $INSTANCE_NAME"
    exit 1
fi

echo "Creating isolated instance: $INSTANCE_NAME (ID: $INSTANCE_ID)"

# Create instance directory
mkdir -p "$INSTANCE_DIR"

# Calculate ports based on instance ID
BACKEND_PORT=$((3000 + INSTANCE_ID * 10))
FRONTEND_PORT=$((3001 + INSTANCE_ID * 10))
ML_SERVICE_PORT=$((8000 + INSTANCE_ID * 10))
POSTGRES_PORT=$((5432 + INSTANCE_ID))
REDIS_PORT=$((6379 + INSTANCE_ID))

# Generate secure password
POSTGRES_PASSWORD=$(openssl rand -hex 16)

# Create .env file
cat > "$ENV_FILE" <<EOF
# Instance Configuration for: $INSTANCE_NAME
# Generated on: $(date)

# Instance Identification
INSTANCE_NAME=$INSTANCE_NAME
INSTANCE_ID=$INSTANCE_ID

# Port Configuration
BACKEND_PORT=$BACKEND_PORT
FRONTEND_PORT=$FRONTEND_PORT
ML_SERVICE_PORT=$ML_SERVICE_PORT
POSTGRES_PORT=$POSTGRES_PORT
REDIS_PORT=$REDIS_PORT

# Database Configuration
DATABASE_NAME=constintel_${INSTANCE_NAME}
POSTGRES_USER=constintel_${INSTANCE_NAME}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
DATABASE_URL=postgresql://constintel_${INSTANCE_NAME}:${POSTGRES_PASSWORD}@postgres:5432/constintel_${INSTANCE_NAME}?schema=public

# Redis Configuration
REDIS_URL=redis://redis:6379

# Environment
NODE_ENV=development

# API URLs (for frontend)
NEXT_PUBLIC_API_URL=http://localhost:$BACKEND_PORT
NEXT_PUBLIC_ML_API_URL=http://localhost:$ML_SERVICE_PORT

# Integration Secrets (configure these as needed)
SHOPIFY_WEBHOOK_SECRET=
SHOPIFY_API_KEY=
SHOPIFY_API_SECRET=
SHOPIFY_STORE_DOMAIN=

WOOCOMMERCE_API_URL=
WOOCOMMERCE_CONSUMER_KEY=
WOOCOMMERCE_CONSUMER_SECRET=

TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=

# Security
JWT_SECRET=$(openssl rand -hex 32)
ENCRYPTION_KEY=$(openssl rand -hex 16)
EOF

echo "✅ Instance created successfully!"
echo ""
echo "Instance: $INSTANCE_NAME"
echo "Ports:"
echo "  - Backend:   $BACKEND_PORT"
echo "  - Frontend:  $FRONTEND_PORT"
echo "  - ML Service: $ML_SERVICE_PORT"
echo "  - PostgreSQL: $POSTGRES_PORT"
echo "  - Redis:     $REDIS_PORT"
echo ""
echo "Configuration: $ENV_FILE"
echo ""
echo "Next steps:"
echo "  1. Review/edit: $ENV_FILE"
echo "  2. Start instance: ./start-instance.sh $INSTANCE_NAME"
echo "  3. View logs: docker-compose -f docker-compose.instance.yml --env-file $ENV_FILE logs -f"

