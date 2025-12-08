#!/bin/bash
# Setup Production Environment
# Creates production instance, configures environment, sets up database with strong security
# HOW TO USE: ./setup-production.sh
# WARNING: Production setup requires manual confirmation and strong secrets

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

INSTANCE_NAME="production"
INSTANCE_ID=2

echo "⚠️  PRODUCTION ENVIRONMENT SETUP"
echo "================================"
echo ""
echo "This will create a production environment with:"
echo "  - Instance name: $INSTANCE_NAME"
echo "  - Ports: 3020-3029"
echo "  - Strong security settings"
echo "  - Production-optimized configuration"
echo ""
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Setup cancelled."
    exit 0
fi

# Check if production instance already exists
if [ -d "instances/$INSTANCE_NAME" ]; then
    echo ""
    echo "⚠️  Production instance already exists!"
    echo "Recreating production environment will DELETE all existing data!"
    read -p "Type 'DELETE PRODUCTION' to confirm: " DELETE_CONFIRM
    if [ "$DELETE_CONFIRM" != "DELETE PRODUCTION" ]; then
        echo "Setup cancelled. Production instance not modified."
        exit 0
    fi
    echo "Removing existing production instance..."
    ./remove-instance.sh "$INSTANCE_NAME"
fi

# Create production instance using existing script
echo ""
echo "📦 Creating production instance..."
./create-instance.sh "$INSTANCE_NAME" "$INSTANCE_ID"

INSTANCE_DIR="instances/$INSTANCE_NAME"
ENV_FILE="$INSTANCE_DIR/.env"

# Generate very strong secrets for production
echo ""
echo "🔐 Generating production secrets..."
PROD_JWT_SECRET=$(openssl rand -hex 64)
PROD_ENCRYPTION_KEY=$(openssl rand -hex 32)
PROD_POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)

# Update .env file with production settings
echo "⚙️  Configuring production-specific settings..."
cat >> "$ENV_FILE" <<EOF

# Production-specific Configuration
NODE_ENV=production
LOG_LEVEL=error
DEBUG_MODE=false
ALLOW_TEST_DATA=false
VERBOSE_LOGGING=false
ENABLE_BACKUP=true
ENABLE_MONITORING=true

# Production secrets (STRONG)
JWT_SECRET=${PROD_JWT_SECRET}
ENCRYPTION_KEY=${PROD_ENCRYPTION_KEY}
POSTGRES_PASSWORD=${PROD_POSTGRES_PASSWORD}
DATABASE_URL=postgresql://constintel_${INSTANCE_NAME}:${PROD_POSTGRES_PASSWORD}@postgres:5432/constintel_${INSTANCE_NAME}?schema=public
EOF

# Save secrets to secure file (should be in .gitignore)
SECRETS_FILE="$INSTANCE_DIR/.env.secrets"
cat > "$SECRETS_FILE" <<EOF
# Production Secrets - KEEP THIS FILE SECURE!
# Generated on: $(date)
# DO NOT COMMIT THIS FILE TO GIT!

JWT_SECRET=${PROD_JWT_SECRET}
ENCRYPTION_KEY=${PROD_ENCRYPTION_KEY}
POSTGRES_PASSWORD=${PROD_POSTGRES_PASSWORD}
EOF

chmod 600 "$SECRETS_FILE"

echo ""
echo "✅ Production instance created successfully!"
echo ""
echo "📋 Instance Details:"
echo "  - Name: $INSTANCE_NAME"
echo "  - Backend Port: 3020"
echo "  - Frontend Port: 3021"
echo "  - ML Service Port: 8020"
echo "  - PostgreSQL Port: 5434"
echo "  - Redis Port: 6381"
echo ""
echo "🔧 Configuration file: $ENV_FILE"
echo "🔐 Secrets file: $SECRETS_FILE (KEEP SECURE - NOT IN GIT)"
echo ""
echo "⚠️  SECURITY REMINDERS:"
echo "  - Review all secrets in: $SECRETS_FILE"
echo "  - Configure production email service (SendGrid/AWS SES)"
echo "  - Set up SSL/TLS certificates for production domain"
echo "  - Configure firewall rules"
echo "  - Set up monitoring and alerting"
echo ""
echo "📝 Next steps:"
echo "  1. Review and edit configuration: $ENV_FILE"
echo "  2. Configure production secrets and API keys"
echo "  3. Start production instance: ./start-instance.sh production"
echo "  4. Run database migrations: ./migrate.sh production"
echo "  5. Create admin user: ./create-admin-user.sh production"
echo ""

