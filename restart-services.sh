#!/bin/bash

# Quick script to stop and restart all services with proper ports
# HOW TO RUN: ./restart-services.sh

set -e

echo "🛑 Stopping all services..."
cd "$(dirname "$0")"

# Stop everything
./stop-all-services.sh 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "tsx.*server" 2>/dev/null || true
pkill -f "uvicorn.*main:app" 2>/dev/null || true

# Free ports
lsof -ti:3000,3001,8000 2>/dev/null | xargs kill -9 2>/dev/null || true

echo "✅ All services stopped"
echo ""
echo "🚀 Starting services with proper ports..."
echo ""

# Create logs directory
mkdir -p logs

# Start Backend on Port 3000
echo "📦 Starting Backend API (Port 3000)..."
cd backend
PORT=3000 BACKEND_PORT=3000 npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "   Backend started (PID: $BACKEND_PID) - http://localhost:3000"
cd ..
sleep 2

# Start ML Service on Port 8000
echo "🤖 Starting ML Service (Port 8000)..."
cd services/ml_service
if [ ! -d "venv" ]; then
    echo "   Creating Python virtual environment..."
    python3 -m venv venv
fi
source venv/bin/activate
pip install -q -r requirements.txt 2>/dev/null || true
PORT=8000 ML_SERVICE_PORT=8000 uvicorn api.main:app --host 0.0.0.0 --port 8000 > ../../logs/ml-service.log 2>&1 &
ML_PID=$!
echo "   ML Service started (PID: $ML_PID) - http://localhost:8000"
deactivate
cd ../..
sleep 2

# Start Frontend on Port 3001
echo "🎨 Starting Frontend (Port 3001)..."
cd frontend
rm -rf .next 2>/dev/null || true
PORT=3001 npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "   Frontend started (PID: $FRONTEND_PID) - http://localhost:3001"
cd ..

# Save PIDs
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
echo ""
echo "📝 Logs: tail -f logs/*.log"
echo ""
echo "To stop: ./stop-all-services.sh"

