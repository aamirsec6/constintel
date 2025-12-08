#!/bin/bash

# GENERATOR: FULL_PLATFORM
# Script to stop all services
# HOW TO RUN: ./stop-all-services.sh

echo "🛑 Stopping ConstIntel Platform Services..."
echo ""

cd "$(dirname "$0")"

# Stop processes from PID file
if [ -f logs/service-pids.txt ]; then
    source logs/service-pids.txt
    echo "Stopping services by PID..."
    kill $BACKEND_PID 2>/dev/null && echo "✅ Backend stopped" || true
    kill $ML_PID 2>/dev/null && echo "✅ ML Service stopped" || true
    kill $FRONTEND_PID 2>/dev/null && echo "✅ Frontend stopped" || true
    rm logs/service-pids.txt
fi

# Stop any processes on service ports
echo "Freeing up service ports..."
lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null && echo "✅ Port 3000 freed" || true
lsof -ti:3001 2>/dev/null | xargs kill -9 2>/dev/null && echo "✅ Port 3001 freed" || true
lsof -ti:8000 2>/dev/null | xargs kill -9 2>/dev/null && echo "✅ Port 8000 freed" || true

# Stop Docker containers (but keep data)
echo "Stopping Docker containers..."
docker-compose -f infra/docker-compose.yml stop 2>/dev/null && echo "✅ Docker containers stopped" || echo "⚠️  No Docker containers to stop"

# Kill any remaining Node/Next.js processes
pkill -f "next dev" 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "tsx.*server" 2>/dev/null || true
pkill -f "uvicorn.*main:app" 2>/dev/null || true

echo ""
echo "✅ All services stopped!"

