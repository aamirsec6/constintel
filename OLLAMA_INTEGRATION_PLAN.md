# Ollama LLM Integration Plan - Natural Language Insights

## Overview

Integrate Ollama LLM (Local Large Language Model) to provide natural language insights, explanations, and query capabilities for the Analytics Dashboard. This will make analytics data more accessible and easier to understand.

## Goals

1. **Auto-Generated Insights** - Automatically generate 3-5 key insights from analytics data
2. **Natural Language Query** - Allow users to ask questions about their data in plain English
3. **Anomaly Explanations** - Explain unusual patterns and anomalies in the data
4. **Report Generation** - Auto-generate executive summaries and reports
5. **Smart Recommendations** - Provide AI-suggested actions based on trends

## Architecture

### Components

1. **Ollama Service** (Python FastAPI)
   - LLM endpoint handler
   - Prompt engineering for analytics insights
   - Response caching

2. **Backend API Routes** (Node.js/TypeScript)
   - `/api/analytics/insights` - Generate insights
   - `/api/analytics/ask` - Natural language query
   - `/api/analytics/explain-anomaly` - Explain anomalies
   - `/api/analytics/generate-report` - Generate reports

3. **Frontend Components** (React/Next.js)
   - `InsightsPanel.tsx` - Auto-generated insights display
   - `AskAI.tsx` - Natural language query interface
   - `AnomalyExplanation.tsx` - Anomaly explanations
   - `ReportGenerator.tsx` - Report generation UI

## Implementation Plan

### Phase 1: Ollama Setup & Infrastructure (Week 1)

#### 1.1 Install and Configure Ollama

**Tasks:**
- Install Ollama locally or in Docker container
- Download appropriate model (llama3, mistral, or phi-3)
- Configure Ollama API endpoint
- Test basic LLM functionality

**Files to Create:**
- `services/ollama/Dockerfile` - Docker container for Ollama
- `services/ollama/docker-compose.yml` - Ollama service configuration
- `scripts/setup-ollama.sh` - Setup script

**Environment Variables:**
```
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3:8b
OLLAMA_ENABLED=true
```

#### 1.2 ML Service LLM Integration

**Tasks:**
- Create Ollama client service
- Implement prompt templates
- Add error handling and fallbacks

**Files to Create:**
- `services/ml_service/api/llm_service.py` - Ollama client wrapper
- `services/ml_service/api/prompts.py` - Prompt templates
- `services/ml_service/api/llm_router.py` - LLM endpoints

**Files to Modify:**
- `services/ml_service/requirements.txt` - Add `requests` for Ollama API
- `services/ml_service/api/main.py` - Include LLM router

### Phase 2: Backend API Routes (Week 1-2)

#### 2.1 Analytics Insights Service

**Tasks:**
- Create service to aggregate analytics data
- Format data for LLM consumption
- Generate insights prompt

**Files to Create:**
- `backend/src/services/analytics/insightsService.ts` - Insights generation logic
- `backend/src/routes/analytics/insights.ts` - Insights API route

**API Endpoint:**
```typescript
POST /api/analytics/insights
Body: {
  dateRange: { startDate, endDate },
  metrics: ['revenue', 'orders', 'customers'] // optional
}
Response: {
  success: true,
  data: {
    insights: [
      {
        title: "Revenue Growth",
        description: "Revenue increased 23% compared to last month...",
        type: "positive",
        metric: "revenue"
      },
      // ... more insights
    ],
    generatedAt: "2024-12-07T..."
  }
}
```

#### 2.2 Natural Language Query Service

**Tasks:**
- Parse user questions
- Extract intent and entities
- Query relevant analytics data
- Generate LLM response

**Files to Create:**
- `backend/src/services/analytics/queryService.ts` - Query processing
- `backend/src/routes/analytics/ask.ts` - Ask API route

**API Endpoint:**
```typescript
POST /api/analytics/ask
Body: {
  question: "What caused the revenue drop last week?",
  dateRange?: { startDate, endDate }
}
Response: {
  success: true,
  data: {
    answer: "The revenue drop was primarily caused by...",
    sources: [
      { metric: "revenue", value: -15, period: "last week" },
      { segment: "at_risk", change: -30 }
    ],
    confidence: 0.85
  }
}
```

#### 2.3 Anomaly Detection & Explanation

**Tasks:**
- Detect anomalies in time-series data
- Generate explanations for anomalies
- Link to relevant metrics

**Files to Create:**
- `backend/src/services/analytics/anomalyService.ts` - Anomaly detection
- `backend/src/routes/analytics/anomalies.ts` - Anomaly endpoints

**API Endpoint:**
```typescript
GET /api/analytics/anomalies
Query: { startDate, endDate, metric? }
Response: {
  success: true,
  data: {
    anomalies: [
      {
        date: "2024-12-05",
        metric: "revenue",
        value: 12500,
        expected: 8500,
        deviation: 47.1,
        explanation: "Revenue spike detected on Dec 5th: This is 2.3x higher than average. Likely due to holiday campaign launch.",
        type: "spike"
      }
    ]
  }
}
```

#### 2.4 Report Generation Service

**Tasks:**
- Aggregate all analytics data
- Generate comprehensive report narrative
- Support PDF export

**Files to Create:**
- `backend/src/services/analytics/reportService.ts` - Report generation
- `backend/src/routes/analytics/reports.ts` - Report endpoints

**API Endpoint:**
```typescript
POST /api/analytics/reports/generate
Body: {
  dateRange: { startDate, endDate },
  format: "text" | "markdown" | "pdf",
  sections: ["executive_summary", "metrics", "insights", "recommendations"]
}
Response: {
  success: true,
  data: {
    report: "Executive Summary\n\nRevenue increased...",
    format: "markdown",
    generatedAt: "2024-12-07T..."
  }
}
```

### Phase 3: Frontend Components (Week 2-3)

#### 3.1 Insights Panel Component

**Tasks:**
- Display auto-generated insights
- Show loading states
- Handle refresh

**Files to Create:**
- `frontend/components/analytics/InsightsPanel.tsx`

**Features:**
- Auto-refresh every 5 minutes
- Collapsible insights
- Color-coded by type (positive/negative/neutral)
- Click to view related charts

#### 3.2 Ask AI Component

**Tasks:**
- Chat-like interface for questions
- Display answers with sources
- Show loading and error states

**Files to Create:**
- `frontend/components/analytics/AskAI.tsx`

**Features:**
- Input field with suggestions
- Conversation history
- Source citations
- Copy answer functionality

#### 3.3 Anomaly Explanation Component

**Tasks:**
- Display detected anomalies
- Show LLM-generated explanations
- Link to relevant data

**Files to Create:**
- `frontend/components/analytics/AnomalyExplanation.tsx`

**Features:**
- Visual anomaly indicators on charts
- Tooltip with explanation
- Detailed view modal

#### 3.4 Report Generator Component

**Tasks:**
- Report generation UI
- Preview and download options
- Format selection

**Files to Create:**
- `frontend/components/analytics/ReportGenerator.tsx`

**Features:**
- Date range picker
- Section selection
- Format options (Text, Markdown, PDF)
- Download button

### Phase 4: Integration & Enhancement (Week 3)

#### 4.1 Dashboard Integration

**Tasks:**
- Add Insights Panel to main dashboard
- Integrate Ask AI widget
- Add anomaly indicators to charts

**Files to Modify:**
- `frontend/app/analytics/dashboard/page.tsx` - Add insights panel and Ask AI
- `frontend/components/analytics/TimeSeriesChart.tsx` - Add anomaly markers

#### 4.2 Caching & Performance

**Tasks:**
- Cache LLM responses in Redis
- Implement rate limiting
- Optimize prompt size

**Files to Modify:**
- `backend/src/services/analytics/insightsService.ts` - Add Redis caching
- `services/ml_service/api/llm_service.py` - Add caching layer

#### 4.3 Error Handling & Fallbacks

**Tasks:**
- Handle Ollama unavailability
- Provide fallback insights
- Graceful degradation

**Files to Modify:**
- `backend/src/services/analytics/insightsService.ts` - Add fallbacks
- `frontend/components/analytics/*.tsx` - Handle errors gracefully

## File Structure

```
services/
├── ollama/
│   ├── Dockerfile
│   └── docker-compose.yml
├── ml_service/
│   ├── api/
│   │   ├── llm_service.py          # NEW
│   │   ├── prompts.py               # NEW
│   │   └── llm_router.py            # NEW
│   └── requirements.txt             # MODIFY
└── backend/
    ├── src/
    │   ├── services/
    │   │   └── analytics/
    │   │       ├── insightsService.ts      # NEW
    │   │       ├── queryService.ts         # NEW
    │   │       ├── anomalyService.ts       # NEW
    │   │       └── reportService.ts        # NEW
    │   └── routes/
    │       └── analytics/
    │           ├── insights.ts             # NEW
    │           ├── ask.ts                  # NEW
    │           ├── anomalies.ts            # NEW
    │           └── reports.ts              # NEW
└── frontend/
    ├── components/
    │   └── analytics/
    │       ├── InsightsPanel.tsx           # NEW
    │       ├── AskAI.tsx                   # NEW
    │       ├── AnomalyExplanation.tsx      # NEW
    │       └── ReportGenerator.tsx         # NEW
    └── app/
        └── analytics/
            └── dashboard/
                └── page.tsx                # MODIFY
```

## Technical Details

### Ollama Model Selection

**Recommended Models:**
1. **llama3:8b** - Best balance of quality and speed (default)
2. **mistral:7b** - Faster, good for real-time queries
3. **phi-3:mini** - Smallest, fastest, good for basic insights

**Model Selection Logic:**
- Use smaller model for real-time queries (Ask AI)
- Use larger model for comprehensive reports

### Prompt Engineering

**Insights Generation Prompt Template:**
```
You are an expert data analyst. Analyze the following analytics data and provide 3-5 key insights in plain English.

Revenue Data: {revenue_data}
Orders Data: {orders_data}
Customer Segments: {segment_data}
Time Range: {date_range}

Provide insights that are:
- Actionable and specific
- Based on actual data trends
- Clear and easy to understand
- Focused on business impact

Format as JSON array:
[
  {
    "title": "Brief title",
    "description": "Detailed explanation",
    "type": "positive|negative|neutral",
    "metric": "revenue|orders|customers",
    "impact": "high|medium|low"
  }
]
```

**Natural Language Query Prompt:**
```
You are an analytics assistant. Answer the user's question about their business data.

Question: {user_question}

Available Data:
- Revenue: {revenue_summary}
- Orders: {orders_summary}
- Customers: {customers_summary}
- Segments: {segments_summary}
- Time Range: {date_range}

Provide a clear, concise answer based on the data. If you don't have enough information, say so.

Format as JSON:
{
  "answer": "Clear answer to the question",
  "sources": [
    { "metric": "revenue", "value": 1234, "period": "last week" }
  ],
  "confidence": 0.85
}
```

### Caching Strategy

**Redis Cache Keys:**
- `llm:insights:{brandId}:{startDate}:{endDate}` - TTL: 5 minutes
- `llm:query:{brandId}:{questionHash}` - TTL: 10 minutes
- `llm:anomalies:{brandId}:{startDate}:{endDate}` - TTL: 15 minutes

**Cache Invalidation:**
- Invalidate on new data ingestion
- Invalidate on date range change
- Manual refresh button clears cache

### Performance Considerations

1. **Async Processing** - Generate insights in background
2. **Streaming Responses** - Stream LLM responses for better UX
3. **Token Limits** - Limit prompt size to prevent OOM
4. **Timeout Handling** - 30 second timeout for LLM requests
5. **Rate Limiting** - Max 10 queries per minute per user

## Environment Variables

**Add to `env.template`:**
```bash
# Ollama Configuration
OLLAMA_URL="http://localhost:11434"
OLLAMA_MODEL="llama3:8b"
OLLAMA_ENABLED="true"
OLLAMA_TIMEOUT="30"
OLLAMA_MAX_TOKENS="1000"

# LLM Features
ENABLE_LLM_INSIGHTS="true"
ENABLE_LLM_QUERY="true"
ENABLE_ANOMALY_DETECTION="true"
ENABLE_REPORT_GENERATION="true"
```

## Dependencies

**Backend (`backend/package.json`):**
- No new dependencies (use existing axios, Redis client)

**ML Service (`services/ml_service/requirements.txt`):**
```
requests>=2.31.0  # For Ollama API calls
```

**Frontend (`frontend/package.json`):**
- No new dependencies (use existing React hooks, axios)

## Testing Plan

### Unit Tests

1. **LLM Service Tests**
   - Test Ollama API connection
   - Test prompt generation
   - Test response parsing

2. **Analytics Services Tests**
   - Test insights generation
   - Test query parsing
   - Test anomaly detection

### Integration Tests

1. **End-to-End Flow**
   - Generate insights from real data
   - Ask question and verify answer
   - Generate report and verify format

2. **Error Handling**
   - Test Ollama unavailability
   - Test timeout scenarios
   - Test invalid queries

### Manual Testing

1. **Dashboard Integration**
   - Verify insights panel displays
   - Test Ask AI widget
   - Check anomaly indicators

2. **Performance**
   - Measure response times
   - Test with large datasets
   - Verify caching works

## Deployment Considerations

### Development

1. Install Ollama locally: `brew install ollama` (macOS) or download from ollama.ai
2. Pull model: `ollama pull llama3:8b`
3. Start Ollama: `ollama serve`

### Production

1. **Docker Deployment**
   - Use Ollama Docker image
   - Configure model persistence
   - Set resource limits

2. **Alternative Options**
   - Use cloud Ollama hosting
   - Use other LLM APIs (OpenAI, Anthropic) as fallback
   - Implement model switching

## Success Metrics

1. **Functionality**
   - ✅ Insights generated automatically
   - ✅ Users can ask questions in plain English
   - ✅ Anomalies explained clearly
   - ✅ Reports generated on-demand

2. **Performance**
   - Insights generated in < 10 seconds
   - Query responses in < 5 seconds
   - 95% cache hit rate

3. **User Experience**
   - Clear, actionable insights
   - Accurate answers to questions
   - Intuitive UI components

## Rollout Plan

### Phase 1: MVP (Week 1-2)
- Basic insights generation
- Simple Ask AI interface
- Basic error handling

### Phase 2: Enhancement (Week 3)
- Anomaly detection
- Report generation
- Improved prompts

### Phase 3: Polish (Week 4)
- UI/UX improvements
- Performance optimization
- Comprehensive testing

## Risk Mitigation

1. **Ollama Unavailability**
   - Graceful fallback to static insights
   - Clear error messages
   - Health check endpoint

2. **LLM Hallucination**
   - Validate responses against actual data
   - Show source citations
   - Allow user feedback

3. **Performance Issues**
   - Implement caching
   - Use smaller models for real-time
   - Background processing for reports

## Future Enhancements

1. **Multi-language Support** - Generate insights in different languages
2. **Custom Prompts** - Allow brands to customize insight templates
3. **Learning from Feedback** - Improve prompts based on user feedback
4. **Advanced Analytics** - Integrate with forecasting models
5. **Voice Interface** - Voice-based queries
6. **Email Reports** - Scheduled report delivery

## Documentation

### User Documentation

1. **How to Use Insights Panel**
2. **How to Ask Questions**
3. **Understanding Anomaly Explanations**
4. **Generating Reports**

### Developer Documentation

1. **LLM Service Architecture**
2. **Prompt Engineering Guide**
3. **Adding New Insight Types**
4. **Customizing Prompts**

## Timeline

- **Week 1:** Ollama setup, backend services, basic insights
- **Week 2:** Frontend components, Ask AI, integration
- **Week 3:** Anomaly detection, report generation, polish
- **Week 4:** Testing, optimization, documentation

## Next Steps

1. Review and approve this plan
2. Set up Ollama environment
3. Begin Phase 1 implementation
4. Regular progress reviews

