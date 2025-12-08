# How to See LLM Difference in Your Dashboard

Based on your dashboard screenshot, here's how to see the LLM difference in action.

## Current Status from Your Dashboard

I can see:
- ✅ Dashboard is running at `localhost:3001/analytics/dashboard`
- ✅ LLM components are visible (Ask AI, Data Anomalies, Generate Report)
- ⚠️ Data showing $0 (may need sample data or correct date range)
- ⚠️ LLM features may need ML service restart

## Step-by-Step: See the LLM Difference

### Step 1: Enable LLM (Restart ML Service)

The LLM routes are in the code but need the service restarted:

```bash
# Find ML service process
ps aux | grep uvicorn | grep 8000

# Restart it (replace <PID> with actual process ID)
kill <PID>

# Restart from services/ml_service directory
cd services/ml_service
export $(grep -v '^#' ../../.env | xargs)
python3 -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload &
```

**Or use the script:**
```bash
./RESTART_ML_FOR_LLM.sh
```

### Step 2: Verify LLM is Working

```bash
# Test LLM endpoint
curl http://localhost:8000/llm/health

# Should return:
# {"status":"healthy","enabled":true,"service":"ollama"}
```

### Step 3: Refresh Dashboard

1. **Hard refresh** your browser:
   - Chrome/Firefox: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
   - This clears cache and reloads components

2. **Check the "Key Insights" Panel:**
   - Before LLM: Generic insights like "Revenue increased by X%"
   - After LLM: Intelligent insights like "Revenue surged 15.5% with High Value segment contributing 36% of total despite being only 9.6% of customer base. Focus on upselling..."

### Step 4: Test "Ask AI" Feature

In the "Ask AI" section you can see in your dashboard:

1. **Click one of the suggested questions:**
   - "What caused the revenue drop last week?"
   - "Which segment is performing best?"
   - "How did orders change compared to last month?"

2. **Without LLM (Fallback):**
   ```
   "I need more information to answer that question."
   ```

3. **With LLM Enabled:**
   ```
   "Based on the data analysis, revenue declined by 8.2% last week 
   compared to the previous week. This appears to be driven by a 12% 
   decrease in order volume... [detailed analysis with sources]"
   ```

### Step 5: Test Data Anomalies

1. **Generate some test data** (if you don't have real data):
   ```bash
   # Create some events with anomalies
   # This would create spikes/drops in your data
   ```

2. **Click on an anomaly** in the "Data Anomalies" section

3. **Without LLM:**
   ```
   "Revenue spike detected: This is 48.0% higher than expected. 
   This could be due to a marketing campaign..."
   ```

4. **With LLM:**
   ```
   "Revenue spike on December 15th (48% above expected) aligns with 
   increased order volume (67 orders vs typical 42) and a surge in 
   High Value customer purchases... [detailed context-aware explanation]"
   ```

## Why Data Shows $0

If your dashboard shows $0 for revenue/orders, possible reasons:

1. **No data in database** - Need to seed/test data
2. **Date range** - Selected date range may not have data
3. **Brand ID** - Dashboard might not be using correct brand ID

**Quick fix:**
```bash
# Check if you have data
curl -H "x-brand-id: rhino-9918" http://localhost:3000/api/profiles | head -20

# Check date range in dashboard
# Try selecting a wider date range
```

## Visual Comparison

### Before LLM (What you might see now):

**Insights Panel:**
- "Strong Revenue Growth - Revenue has increased by 15.5%"
- Basic, template-based descriptions

**Ask AI:**
- "I need more information to answer that question"

**Anomalies:**
- "Revenue spike detected: This is 48.0% higher than expected"

### After LLM (What you'll see):

**Insights Panel:**
- "Exceptional Revenue Growth Driven by High-Value Customers - Revenue surged 15.5% with the High Value segment contributing $45K (36% of total) despite being only 9.6% of your customer base. Focus on upselling Regular customers..."
- Context-aware, actionable insights

**Ask AI:**
- Detailed analysis with specific numbers, root causes, and recommendations
- Cites data sources
- Confidence scores

**Anomalies:**
- Detailed explanations correlating anomalies with other metrics
- Actionable recommendations based on context

## Quick Test Commands

```bash
# 1. Check LLM is enabled
curl http://localhost:8000/llm/health

# 2. Test insights generation
curl -X POST http://localhost:8000/llm/insights \
  -H "Content-Type: application/json" \
  -d '{
    "revenue": {"total": 125000, "growth": 15.5},
    "orders": {"total": 342, "avgOrderValue": 365.50},
    "customers": {"total": 1250, "new": 87}
  }' | jq '.'

# 3. Test question answering
curl -X POST http://localhost:8000/llm/ask \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What caused the revenue growth?",
    "revenue": {"total": 125000, "growth": 15.5}
  }' | jq '.'
```

## Next Actions

1. **Restart ML service** to enable LLM routes
2. **Refresh dashboard** (hard refresh)
3. **Try the Ask AI feature** with one of the suggested questions
4. **Compare the insights** - you'll see the difference immediately!

The LLM features will provide **much more intelligent, actionable insights** compared to the basic fallback responses.

---

**Need help?** Run `./ENABLE_LLM_QUICK.sh` for a quick status check!

