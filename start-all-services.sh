#!/bin/bash

# GENERATOR: FULL_PLATFORM
# Script to start all services with proper ports
# HOW TO RUN: ./start-all-services.sh

set -e

echo "🚀 Starting ConstIntel Platform Services..."
echo ""

cd "$(dirname "$0")"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found. Using defaults."
    echo "   Copy env.template to .env and configure if needed."
fi

# Start Docker services (PostgreSQL, Redis)
echo "📦 Starting Docker services (PostgreSQL, Redis)..."
docker-compose -f infra/docker-compose.yml up -d postgres redis

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check if services are running
if ! docker ps | grep -q "constintel-postgres\|postgres"; then
    echo "❌ PostgreSQL container not running. Starting..."
    docker-compose -f infra/docker-compose.yml up -d postgres
    sleep 3
fi

if ! docker ps | grep -q "constintel-redis\|redis"; then
    echo "❌ Redis container not running. Starting..."
    docker-compose -f infra/docker-compose.yml up -d redis
    sleep 3
fi

# Start Backend (Port 3000)
echo ""
echo "🔧 Starting Backend API (Port 3000)..."
cd backend
if [ ! -f .env ]; then
    cp ../env.template .env 2>/dev/null || true
fi
npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "   Backend started (PID: $BACKEND_PID)"
cd ..

# Start ML Service (Port 8000)
echo ""
echo "🤖 Starting ML Service (Port 8000)..."
cd services/ml_service
if [ ! -f .env ]; then
    cp ../../env.template .env 2>/dev/null || true
fi
# Check if virtual environment exists, if not create it
if [ ! -d "venv" ]; then
    echo "   Creating Python virtual environment..."
    python3 -m venv venv
fi
source venv/bin/activate
pip install -q -r requirements.txt 2>/dev/null || true
uvicorn api.main:app --host 0.0.0.0 --port 8000 > ../../logs/ml-service.log 2>&1 &
ML_PID=$!
echo "   ML Service started (PID: $ML_PID)"
deactivate
cd ../..

# Start Frontend (Port 3001)
echo ""
echo "🎨 Starting Frontend (Port 3001)..."
cd frontend
if [ ! -f .env.local ]; then
    cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_ML_API_URL=http://localhost:8000
EOF
fi
# Clear Next.js cache
rm -rf .next 2>/dev/null || true
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "   Frontend started (PID: $FRONTEND_PID)"
cd ..

# Create logs directory if it doesn't exist
mkdir -p logs

# Save PIDs for later stopping
cat > logs/service-pids.txt << EOF
BACKEND_PID=$BACKEND_PID
ML_PID=$ML_PID
FRONTEND_PID=$FRONTEND_PID
EOF

echo ""
echo "✅ All services started!"
echo ""
echo "📍 Service URLs:"
echo "   Frontend:    http://localhost:3001"
echo "   Backend API: http://localhost:3000"
echo "   ML Service:  http://localhost:8000"
echo "   PostgreSQL:  localhost:5432"
echo "   Redis:       localhost:6379"
echo ""
echo "📝 Logs are available in the logs/ directory"
echo ""
echo "To stop all services, run: ./stop-all-services.sh"
echo ""

