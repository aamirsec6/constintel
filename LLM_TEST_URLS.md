# Direct URLs to Test LLM Features

After restarting the ML service, use these direct URLs to test LLM features.

## 🔗 Direct Test URLs

### 1. LLM Health Check
```
http://localhost:8000/llm/health
```
**Expected:** `{"status":"healthy","enabled":true,"service":"ollama"}`

### 2. Test Insights Generation (API)
Open this in browser or use curl:
```
http://localhost:8000/llm/insights
```
**Method:** POST
**Body:** See test data below

### 3. Analytics Dashboard (Main UI)
```
http://localhost:3001/analytics/dashboard
```
**Features to test:**
- "AI-Generated Insights" panel (top section)
- "Ask AI" widget (left side)
- "Data Anomalies" section
- "Generate Report" button

### 4. Ask AI Direct Test
```
http://localhost:8000/llm/ask
```
**Method:** POST
**Body:** See test data below

### 5. Anomaly Explanation Test
```
http://localhost:8000/llm/explain-anomaly
```
**Method:** POST
**Body:** See test data below

## 📋 Quick Test Commands

### Test LLM Health
```bash
curl http://localhost:8000/llm/health
```

### Test Insights (With Sample Data)
```bash
curl -X POST http://localhost:8000/llm/insights \
  -H "Content-Type: application/json" \
  -d '{
    "revenue": {"total": 125000, "average": 4166.67, "growth": 15.5, "trend": "increasing"},
    "orders": {"total": 342, "avgOrderValue": 365.50},
    "customers": {"total": 1250, "new": 87, "active": 1180},
    "segments": {
      "High Value": {"count": 120, "revenue": 45000},
      "Regular": {"count": 850, "revenue": 60000}
    },
    "dateRange": {"startDate": "2024-12-01", "endDate": "2024-12-31"}
  }' | jq '.'
```

### Test Question Answering
```bash
curl -X POST http://localhost:8000/llm/ask \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What caused the revenue growth?",
    "revenue": {"total": 125000, "growth": 15.5},
    "segments": {
      "High Value": {"count": 120, "revenue": 45000}
    },
    "dateRange": {"startDate": "2024-12-01", "endDate": "2024-12-31"}
  }' | jq '.'
```

## 🎯 Main Dashboard URL

**Primary URL to visit:**
```
http://localhost:3001/analytics/dashboard
```

After restarting ML service:
1. Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
2. Check "AI-Generated Insights" panel
3. Try "Ask AI" with suggested questions
4. Click on "Data Anomalies" to see LLM explanations

## 🔍 Verification Steps

1. **Check LLM is enabled:**
   ```
   http://localhost:8000/llm/health
   ```

2. **Visit dashboard:**
   ```
   http://localhost:3001/analytics/dashboard
   ```

3. **Look for intelligent insights** (not generic templates)

4. **Try Ask AI** - should give detailed answers

