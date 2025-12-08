# LLM Comparison Demo Guide

Quick guide to see the actual difference between LLM-powered and fallback features.

## Quick Demo Steps

### Step 1: Test Without LLM (Fallback Mode)

1. **Ensure LLM is disabled:**
   ```bash
   # In your .env file
   ENABLE_LLM_INSIGHTS=false
   ENABLE_LLM_QUERY=false
   ```

2. **Start services:**
   ```bash
   cd infra
   ./start-instance.sh staging  # or your instance
   ```

3. **Access dashboard:**
   - Visit http://localhost:3011/analytics/dashboard
   - Go to "AI-Generated Insights" panel
   - Note the simple, generic insights

### Step 2: Test With LLM

1. **Install Ollama (if not installed):**
   ```bash
   # macOS
   brew install ollama
   
   # Linux
   curl -fsSL https://ollama.ai/install.sh | sh
   ```

2. **Start Ollama:**
   ```bash
   ollama serve
   ```

3. **Download model (in new terminal):**
   ```bash
   ollama pull llama3:8b
   # This may take a few minutes (4.7GB download)
   ```

4. **Enable LLM:**
   ```bash
   # In your .env file
   ENABLE_LLM_INSIGHTS=true
   ENABLE_LLM_QUERY=true
   OLLAMA_URL=http://localhost:11434
   OLLAMA_MODEL=llama3:8b
   ```

5. **Restart services:**
   ```bash
   cd infra
   ./stop-instance.sh staging
   ./start-instance.sh staging
   ```

6. **Check LLM health:**
   ```bash
   curl http://localhost:8000/llm/health
   # Should return: {"status":"healthy","enabled":true}
   ```

7. **Access dashboard again:**
   - Visit http://localhost:3011/analytics/dashboard
   - Go to "AI-Generated Insights" panel
   - See intelligent, context-aware insights!

### Step 3: Run Comparison Script

```bash
# Run the automated comparison
./test-llm-comparison.sh
```

This will show side-by-side comparisons of:
- Insights generation
- Question answering
- Anomaly explanations

## What You'll See

### Insights Panel

**Without LLM:**
- "Strong Revenue Growth - Revenue has increased by 15.5%"
- "Average Order Value - The average order value is $365.50"
- Generic, template-based descriptions

**With LLM:**
- "Exceptional Revenue Growth Driven by High-Value Customers - Revenue surged 15.5% with the High Value segment contributing $45K (36% of total) despite being only 9.6% of your customer base..."
- Context-aware analysis
- Actionable recommendations
- Professional insights

### Ask AI Feature

**Without LLM:**
- "I need more information to answer that question"
- Basic keyword matching

**With LLM:**
- Detailed analysis of your question
- Context-aware answers
- Data source citations
- Specific recommendations

### Anomaly Explanations

**Without LLM:**
- "Revenue spike detected: This is 48.0% higher than expected. This could be due to a marketing campaign..."

**With LLM:**
- Detailed analysis correlating the spike with other metrics
- Identification of contributing factors
- Specific recommendations based on context

## API Testing

### Test Insights Endpoint

```bash
# With LLM enabled
curl -X POST http://localhost:8000/llm/insights \
  -H "Content-Type: application/json" \
  -d '{
    "revenue": {"total": 125000, "average": 4166.67, "growth": 15.5},
    "orders": {"total": 342, "avgOrderValue": 365.50},
    "customers": {"total": 1250, "new": 87, "active": 1180},
    "segments": {
      "High Value": {"count": 120, "revenue": 45000},
      "Regular": {"count": 850, "revenue": 60000}
    }
  }' | jq '.'
```

### Test Question Endpoint

```bash
curl -X POST http://localhost:8000/llm/ask \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What caused the revenue growth?",
    "revenue": {"total": 125000, "growth": 15.5},
    "segments": {
      "High Value": {"count": 120, "revenue": 45000}
    }
  }' | jq '.'
```

## Visual Comparison

Visit the dashboard and compare:

1. **Before (Fallback):**
   - Simple metric cards
   - Generic insights
   - Basic information

2. **After (LLM):**
   - Rich, contextual insights
   - Actionable recommendations
   - Professional analysis

## Performance Notes

- **First request:** 5-10 seconds (LLM processing)
- **Cached requests:** <1 second (Redis cache)
- **Fallback mode:** Instant (no LLM processing)

## Troubleshooting

### Ollama Not Working

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Check logs
ollama logs

# Restart Ollama
ollama serve
```

### LLM Health Check Fails

```bash
# Test ML service
curl http://localhost:8000/health

# Test LLM endpoint
curl http://localhost:8000/llm/health

# Check environment variables
echo $OLLAMA_URL
echo $OLLAMA_MODEL
echo $ENABLE_LLM_INSIGHTS
```

## Summary

**The difference is clear:**
- **LLM:** Intelligent, contextual, actionable insights
- **Fallback:** Basic, generic, template-based insights

**LLM provides 10x more value** with minimal setup effort!

