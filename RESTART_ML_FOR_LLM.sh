#!/bin/bash
# Restart ML Service to load LLM routes
# HOW TO USE: ./RESTART_ML_FOR_LLM.sh

set -e

echo "🔄 Restarting ML Service to Load LLM Routes"
echo "============================================"
echo ""

# Find ML service process
ML_PID=$(ps aux | grep -E "uvicorn.*main:app.*8000" | grep -v grep | awk '{print $2}' | head -1)

if [ -z "$ML_PID" ]; then
    echo "⚠️  ML service process not found"
    echo "Starting ML service..."
    
    cd services/ml_service
    
    # Load environment variables
    if [ -f ../../.env ]; then
        export $(grep -v '^#' ../../.env | xargs)
    fi
    
    # Start ML service
    python3 -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload &
    
    echo "✅ ML service started"
    echo "   PID: $!"
else
    echo "📍 Found ML service process (PID: $ML_PID)"
    echo ""
    read -p "Kill and restart ML service? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🛑 Stopping ML service..."
        kill $ML_PID
        sleep 2
        
        # Verify it's stopped
        if ps -p $ML_PID > /dev/null 2>&1; then
            echo "⚠️  Process still running, forcing stop..."
            kill -9 $ML_PID
            sleep 1
        fi
        
        echo "✅ ML service stopped"
        echo ""
        echo "🚀 Starting ML service with LLM support..."
        
        cd services/ml_service
        
        # Load environment variables
        if [ -f ../../.env ]; then
            export $(grep -v '^#' ../../.env | xargs)
            echo "✅ Loaded environment variables from ../../.env"
        fi
        
        # Start ML service in background
        nohup python3 -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload > /tmp/ml-service.log 2>&1 &
        NEW_PID=$!
        
        echo "✅ ML service started"
        echo "   PID: $NEW_PID"
        echo "   Logs: /tmp/ml-service.log"
        
        # Wait a few seconds for startup
        echo ""
        echo "⏳ Waiting for service to start..."
        sleep 5
        
        # Check if it's running
        if ps -p $NEW_PID > /dev/null 2>&1; then
            echo "✅ ML service is running"
        else
            echo "❌ ML service failed to start"
            echo "Check logs: tail -f /tmp/ml-service.log"
            exit 1
        fi
    else
        echo "Cancelled. ML service not restarted."
        exit 0
    fi
fi

# Wait a bit more for routes to load
echo ""
echo "⏳ Waiting for routes to load..."
sleep 3

# Test LLM endpoint
echo ""
echo "🧪 Testing LLM endpoint..."
LLM_HEALTH=$(curl -s http://localhost:8000/llm/health 2>&1)

if echo "$LLM_HEALTH" | grep -q "healthy\|enabled"; then
    echo "✅ LLM endpoint is working!"
    echo "   Response: $LLM_HEALTH"
    echo ""
    echo "🎉 Success! LLM features are now enabled!"
    echo ""
    echo "Next steps:"
    echo "  1. Visit http://localhost:3001/analytics/dashboard"
    echo "  2. Check 'AI-Generated Insights' panel"
    echo "  3. Try 'Ask AI' feature"
    echo "  4. Run ./QUICK_LLM_TEST.sh to test"
else
    echo "⚠️  LLM endpoint check: $LLM_HEALTH"
    echo ""
    echo "💡 Troubleshooting:"
    echo "  1. Check ML service logs: tail -f /tmp/ml-service.log"
    echo "  2. Verify .env has LLM settings"
    echo "  3. Check if Ollama is running: curl http://localhost:11434/api/tags"
    echo "  4. Try manual restart from services/ml_service directory"
fi

