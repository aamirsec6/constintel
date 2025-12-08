#!/bin/bash
# GENERATOR: FULL_PLATFORM
# ASSUMPTIONS: Docker installed, .env file exists
# HOW TO RUN: chmod +x infra/setup-dev.sh && ./infra/setup-dev.sh

set -e

echo "🚀 Setting up ConstIntel development environment..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ Created .env file. Please edit it with your values."
    else
        echo "❌ .env.example not found. Please create .env manually."
        exit 1
    fi
fi

# Start infrastructure services
echo "📦 Starting infrastructure services (Postgres, Redis)..."
docker-compose -f infra/docker-compose.yml up -d postgres redis

# Wait for Postgres to be ready
echo "⏳ Waiting for Postgres to be ready..."
sleep 5

# Run migrations
echo "🗄️  Running database migrations..."
cd backend
if [ ! -d "node_modules" ]; then
    echo "📥 Installing backend dependencies..."
    npm install
fi

echo "🔧 Generating Prisma client..."
npx prisma generate

echo "📊 Running migrations..."
npx prisma migrate dev --name init || echo "⚠️  Migration may have already run"

cd ..

# Start all services
echo "🚀 Starting all services..."
docker-compose -f infra/docker-compose.yml up -d

echo ""
echo "✅ Setup complete!"
echo ""
echo "Services running:"
echo "  - Backend API: http://localhost:3000"
echo "  - Frontend: http://localhost:3001"
echo "  - ML Service: http://localhost:8000"
echo "  - Postgres: localhost:5432"
echo "  - Redis: localhost:6379"
echo ""
echo "To view logs: docker-compose -f infra/docker-compose.yml logs -f"
echo "To stop: docker-compose -f infra/docker-compose.yml down"

