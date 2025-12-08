#!/bin/bash
# Quick script to enable LLM and see the difference
# HOW TO USE: ./ENABLE_LLM_QUICK.sh

echo "🚀 Quick LLM Enable Guide"
echo "========================"
echo ""

# Check Ollama
echo "1. Checking Ollama..."
if curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
    echo "   ✅ Ollama is running"
else
    echo "   ❌ Ollama not running"
    echo "   Start it: ollama serve"
    exit 1
fi

# Check ML service
echo ""
echo "2. Checking ML Service..."
ML_PID=$(ps aux | grep -E "uvicorn.*8000" | grep -v grep | awk '{print $2}' | head -1)

if [ -z "$ML_PID" ]; then
    echo "   ❌ ML service not running"
    echo "   Start it first from services/ml_service directory"
    exit 1
else
    echo "   ✅ ML service running (PID: $ML_PID)"
fi

# Check LLM endpoint
echo ""
echo "3. Checking LLM Endpoint..."
LLM_TEST=$(curl -s http://localhost:8000/llm/health 2>&1)
if echo "$LLM_TEST" | grep -q "healthy\|enabled"; then
    echo "   ✅ LLM is enabled and working!"
    echo "   Response: $LLM_TEST"
else
    echo "   ⚠️  LLM endpoint not available (returns: $LLM_TEST)"
    echo ""
    echo "   🔄 To enable LLM, restart ML service:"
    echo ""
    echo "   Option 1: Kill and restart manually"
    echo "   ------------------------------------"
    echo "   kill $ML_PID"
    echo "   cd services/ml_service"
    echo "   export \$(grep -v '^#' ../../.env | xargs)"
    echo "   python3 -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload &"
    echo ""
    echo "   Option 2: Use restart script"
    echo "   -----------------------------"
    echo "   ./RESTART_ML_FOR_LLM.sh"
    echo ""
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 To See LLM Difference in Dashboard:"
echo ""
echo "1. Make sure LLM is enabled (restart ML service if needed)"
echo "2. Visit: http://localhost:3001/analytics/dashboard"
echo "3. Look at 'Key Insights' panel - should show intelligent insights"
echo "4. Try 'Ask AI' - ask: 'What caused the revenue growth?'"
echo "5. Check 'Data Anomalies' - click to see LLM explanations"
echo ""
echo "📖 See comparison examples in: LLM_COMPARISON_DEMO.md"
echo ""

