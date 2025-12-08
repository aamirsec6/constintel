# Enable LLM Features - Quick Setup

Your Ollama is already installed and `llama3:8b` model is available! ✅

## Current Status

✅ Ollama installed: `/opt/homebrew/bin/ollama`
✅ Model downloaded: `llama3:8b` (4.7GB)
✅ LLM settings added to `.env`

## Next Steps

### Step 1: Ensure Ollama is Running

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# If not running, start it:
ollama serve
```

### Step 2: Restart ML Service to Load LLM Routes

The ML service needs to restart to load the new LLM routes. Choose one:

**Option A: If using Docker Compose:**
```bash
cd infra
docker-compose restart ml-service
# OR
docker-compose -f docker-compose.instance.yml restart ml-service
```

**Option B: If running services directly:**
```bash
# Stop ML service (find the process)
ps aux | grep "ml_service\|uvicorn"

# Restart ML service
cd services/ml_service
# Stop current process, then:
python -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

**Option C: If using instance management:**
```bash
cd infra
./stop-instance.sh staging  # or your instance name
./start-instance.sh staging
```

### Step 3: Verify LLM is Working

```bash
# Test LLM health endpoint
curl http://localhost:8000/llm/health

# Expected response:
# {"status":"healthy","enabled":true,"service":"ollama"}
```

### Step 4: Run Quick Test

```bash
# Run the test script
./QUICK_LLM_TEST.sh
```

### Step 5: See It in Action

1. **Visit Analytics Dashboard:**
   ```
   http://localhost:3001/analytics/dashboard
   ```

2. **Check "AI-Generated Insights" Panel:**
   - Should show intelligent, context-aware insights
   - Not just basic templates

3. **Try "Ask AI" Feature:**
   - Ask: "What caused the revenue growth?"
   - Should get detailed, intelligent answer

## What You'll See

### Before (Without LLM):
- Generic insights like "Revenue increased by 15.5%"
- Basic template responses

### After (With LLM):
- Intelligent insights like "Revenue surged 15.5% with High Value segment contributing 36% of total despite being only 9.6% of customer base. Focus on upselling Regular customers..."
- Context-aware analysis
- Actionable recommendations

## Troubleshooting

### LLM Endpoint Still 404

1. **Check ML service is running:**
   ```bash
   curl http://localhost:8000/health
   ```

2. **Check ML service logs:**
   ```bash
   # Docker
   docker logs <ml-service-container> | grep -i llm
   
   # Or direct
   tail -f /path/to/ml-service/logs
   ```

3. **Verify environment variables are loaded:**
   ```bash
   # In ML service container/environment
   echo $OLLAMA_ENABLED
   echo $ENABLE_LLM_INSIGHTS
   ```

4. **Restart ML service:**
   - Stop and start the service
   - Ensure `.env` is loaded

### Ollama Not Responding

```bash
# Check Ollama status
curl http://localhost:11434/api/tags

# Restart Ollama
ollama serve
```

### Model Not Found

```bash
# List available models
ollama list

# Pull model if needed
ollama pull llama3:8b
```

## Quick Commands Reference

```bash
# Check Ollama
curl http://localhost:11434/api/tags

# Check ML Service
curl http://localhost:8000/health

# Check LLM Endpoint
curl http://localhost:8000/llm/health

# Test LLM Insights
curl -X POST http://localhost:8000/llm/insights \
  -H "Content-Type: application/json" \
  -d '{"revenue": {"total": 100000, "growth": 10}}'

# Run Full Test
./QUICK_LLM_TEST.sh
```

## Environment Variables Added

These were added to your `.env`:

```bash
OLLAMA_URL="http://localhost:11434"
OLLAMA_MODEL="llama3:8b"
OLLAMA_ENABLED="true"
ENABLE_LLM_INSIGHTS="true"
ENABLE_LLM_QUERY="true"
ENABLE_ANOMALY_DETECTION="true"
ENABLE_REPORT_GENERATION="true"
```

**Important:** Restart your ML service after adding these!

## See the Difference

Once LLM is enabled and working:

1. Visit the Analytics Dashboard
2. Compare insights with/without LLM
3. Try asking natural language questions
4. Check anomaly explanations

The difference is **dramatic** - LLM provides 10x better, actionable insights!

---

**Ready?** Restart your ML service and run `./QUICK_LLM_TEST.sh` to verify everything works!

