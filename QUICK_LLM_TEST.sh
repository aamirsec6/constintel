#!/bin/bash
# Quick test to see LLM in action
# HOW TO USE: ./QUICK_LLM_TEST.sh

set -e

echo "🤖 Testing LLM Integration"
echo "=========================="
echo ""

# Check Ollama
echo "1️⃣ Checking Ollama..."
if curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
    echo "   ✅ Ollama is running"
    MODELS=$(curl -s http://localhost:11434/api/tags | jq -r '.models[].name' 2>/dev/null | tr '\n' ', ')
    echo "   📦 Available models: $MODELS"
else
    echo "   ❌ Ollama is not running!"
    echo "   Start it with: ollama serve"
    exit 1
fi

# Check ML Service
echo ""
echo "2️⃣ Checking ML Service..."
ML_HEALTH=$(curl -s http://localhost:8000/health 2>&1)
if echo "$ML_HEALTH" | grep -q "healthy"; then
    echo "   ✅ ML Service is running"
else
    echo "   ❌ ML Service is not running!"
    echo "   Start it with your normal service start commands"
    exit 1
fi

# Test LLM Health
echo ""
echo "3️⃣ Testing LLM Endpoint..."
LLM_HEALTH=$(curl -s http://localhost:8000/llm/health 2>&1)
if echo "$LLM_HEALTH" | grep -q "healthy\|enabled"; then
    echo "   ✅ LLM endpoint is available"
    echo "   Response: $LLM_HEALTH"
else
    echo "   ⚠️  LLM endpoint returned: $LLM_HEALTH"
    echo "   The service may need to be restarted to load LLM routes"
fi

# Test actual LLM call
echo ""
echo "4️⃣ Testing LLM Insight Generation..."
echo "   (This will take 5-10 seconds for first call)"

SAMPLE_DATA='{
  "revenue": {"total": 125000, "average": 4166.67, "growth": 15.5, "trend": "increasing"},
  "orders": {"total": 342, "avgOrderValue": 365.50},
  "customers": {"total": 1250, "new": 87, "active": 1180},
  "segments": {
    "High Value": {"count": 120, "revenue": 45000},
    "Regular": {"count": 850, "revenue": 60000},
    "At Risk": {"count": 280, "revenue": 20000}
  },
  "dateRange": {"startDate": "2024-12-01", "endDate": "2024-12-31"}
}'

RESPONSE=$(curl -s -X POST http://localhost:8000/llm/insights \
  -H "Content-Type: application/json" \
  -d "$SAMPLE_DATA" \
  --max-time 30 2>&1)

if echo "$RESPONSE" | grep -q "success.*true"; then
    echo "   ✅ LLM generated insights successfully!"
    echo ""
    echo "   📊 Sample Insight:"
    echo "$RESPONSE" | jq -r '.data.insights[0] | "      Title: \(.title)\n      Description: \(.description)"' 2>/dev/null || echo "$RESPONSE" | head -20
else
    echo "   ⚠️  LLM call result:"
    echo "$RESPONSE" | head -10
    echo ""
    echo "   💡 Tip: Make sure:"
    echo "      - Ollama is running (ollama serve)"
    echo "      - llama3:8b model is downloaded (ollama pull llama3:8b)"
    echo "      - ML service has OLLAMA_ENABLED=true"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Test Complete!"
echo ""
echo "Next steps:"
echo "  1. Visit http://localhost:3001/analytics/dashboard"
echo "  2. Check the 'AI-Generated Insights' panel"
echo "  3. Try the 'Ask AI' feature"
echo "  4. Compare with/without LLM to see the difference!"
echo ""

