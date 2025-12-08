#!/bin/bash
# Setup Staging Environment
# Creates staging instance, configures environment, sets up database, creates admin user
# HOW TO USE: ./setup-staging.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

INSTANCE_NAME="staging"
INSTANCE_ID=1

echo "🚀 Setting up Staging Environment..."
echo ""

# Check if staging instance already exists
if [ -d "instances/$INSTANCE_NAME" ]; then
    echo "⚠️  Staging instance already exists."
    read -p "Do you want to recreate it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Removing existing staging instance..."
        ./remove-instance.sh "$INSTANCE_NAME"
    else
        echo "Exiting. Use ./start-instance.sh staging to start existing instance."
        exit 0
    fi
fi

# Create staging instance using existing script
echo "📦 Creating staging instance..."
./create-instance.sh "$INSTANCE_NAME" "$INSTANCE_ID"

INSTANCE_DIR="instances/$INSTANCE_NAME"
ENV_FILE="$INSTANCE_DIR/.env"

# Update environment-specific settings
echo "⚙️  Configuring staging-specific settings..."

# Generate strong secrets for staging
STAGING_JWT_SECRET=$(openssl rand -hex 32)
STAGING_ENCRYPTION_KEY=$(openssl rand -hex 16)
STAGING_POSTGRES_PASSWORD=$(openssl rand -hex 16)

# Update .env file with staging settings
cat >> "$ENV_FILE" <<EOF

# Staging-specific Configuration
NODE_ENV=staging
LOG_LEVEL=debug
DEBUG_MODE=true
ALLOW_TEST_DATA=true
VERBOSE_LOGGING=true

# Override secrets if needed
JWT_SECRET=${STAGING_JWT_SECRET}
ENCRYPTION_KEY=${STAGING_ENCRYPTION_KEY}
POSTGRES_PASSWORD=${STAGING_POSTGRES_PASSWORD}
DATABASE_URL=postgresql://constintel_${INSTANCE_NAME}:${STAGING_POSTGRES_PASSWORD}@postgres:5432/constintel_${INSTANCE_NAME}?schema=public
EOF

echo "✅ Staging instance created successfully!"
echo ""
echo "📋 Instance Details:"
echo "  - Name: $INSTANCE_NAME"
echo "  - Backend Port: 3010"
echo "  - Frontend Port: 3011"
echo "  - ML Service Port: 8010"
echo "  - PostgreSQL Port: 5433"
echo "  - Redis Port: 6380"
echo ""
echo "🔧 Configuration file: $ENV_FILE"
echo ""
echo "📝 Next steps:"
echo "  1. Review and edit configuration: $ENV_FILE"
echo "  2. Start staging instance: ./start-instance.sh staging"
echo "  3. Run database migrations: ./migrate.sh staging"
echo "  4. Create admin user: ./create-admin-user.sh staging"
echo ""

