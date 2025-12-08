// GENERATOR: SIRI_LIKE_LLM
// Natural language query service for analytics with conversation support
// ASSUMPTIONS: ML service LLM endpoints available, Redis for caching
// HOW TO USE: import { answerQuery } from './queryService'

import axios from 'axios';
import { getRedisClient } from '../redis/redisClient';
import { getConversationHistory } from './conversationService';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || process.env.NEXT_PUBLIC_ML_API_URL || 'http://localhost:8000';
const LLM_ENABLED = process.env.ENABLE_LLM_QUERY === 'true';

export interface QuerySource {
  metric: string;
  value: number;
  period: string;
  description?: string;
}

export interface QueryResult {
  answer: string;
  sources: QuerySource[];
  confidence: number;
  followUpQuestions?: string[];
  proactiveInsights?: string[];
  conversationSummary?: string;
}

/**
 * Answer a natural language question about analytics data with conversation support
 */
export async function answerQuery(
  brandId: string,
  question: string,
  dateRange: { startDate: Date; endDate: Date },
  analyticsData: {
    revenue?: any;
    orders?: any;
    customers?: any;
    segments?: any;
    brandContext?: any; // Brand name, industry, etc.
  },
  options?: {
    sessionId?: string;
    conversationHistory?: string;
  }
): Promise<QueryResult> {
  if (!LLM_ENABLED) {
    return getFallbackAnswer(question, analyticsData);
  }

  // Get conversation history if sessionId provided
  let conversationHistory = options?.conversationHistory;
  if (!conversationHistory && options?.sessionId) {
    conversationHistory = await getConversationHistory(brandId, options.sessionId);
  }

  // Check cache first (but don't cache if there's conversation history - context matters)
  const questionHash = Buffer.from(question.toLowerCase().trim()).toString('base64').slice(0, 50);
  const cacheKey = `query:${brandId}:${questionHash}:${dateRange.startDate.toISOString()}:${dateRange.endDate.toISOString()}`;
  
  // Only use cache if no conversation history (stateless queries)
  if (!conversationHistory) {
    try {
      const redis = await getRedisClient();
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.warn('Redis cache not available for query:', error);
    }
  }

  try {
    // Call ML service LLM endpoint with conversation context
    const response = await axios.post(`${ML_SERVICE_URL}/llm/ask`, {
      question: question.trim(),
      revenue: analyticsData.revenue || {},
      orders: analyticsData.orders || {},
      customers: analyticsData.customers || {},
      segments: analyticsData.segments || {},
      brandContext: analyticsData.brandContext || {},
      dateRange: {
        startDate: dateRange.startDate.toISOString().split('T')[0],
        endDate: dateRange.endDate.toISOString().split('T')[0],
      },
      conversationHistory: conversationHistory || undefined,
    }, {
      timeout: 30000, // 30 second timeout
    });

    if (response.data.success && response.data.data) {
      const result: QueryResult = {
        answer: response.data.data.answer || 'Unable to generate answer.',
        sources: response.data.data.sources || [],
        confidence: response.data.data.confidence || 0.7,
        followUpQuestions: response.data.data.followUpQuestions || [],
        proactiveInsights: response.data.data.proactiveInsights || [],
        conversationSummary: response.data.data.conversationSummary,
      };

      // Cache the result (10 minute TTL) - only if no conversation history
      if (!conversationHistory) {
        try {
          const redis = await getRedisClient();
          await redis.setex(cacheKey, 600, JSON.stringify(result));
        } catch (error) {
          console.warn('Failed to cache query result:', error);
        }
      }

      return result;
    }

    return getFallbackAnswer(question, analyticsData);
  } catch (error: any) {
    console.error('Error answering query from LLM:', error.message);
    return getFallbackAnswer(question, analyticsData);
  }
}

/**
 * Generate fallback answer when LLM is unavailable
 */
function getFallbackAnswer(
  question: string,
  analyticsData: any
): QueryResult {
  const questionLower = question.toLowerCase();
  
  // Simple keyword-based responses
  if (questionLower.includes('revenue')) {
    const revenue = analyticsData.revenue;
    if (revenue) {
      return {
        answer: `Total revenue is $${revenue.total?.toLocaleString() || 0}. ` +
                `Average daily revenue is $${revenue.average?.toLocaleString() || 0}. ` +
                `Growth rate is ${revenue.growth?.toFixed(1) || 0}%.`,
        sources: [
          { metric: 'revenue', value: revenue.total || 0, period: 'current' },
        ],
        confidence: 0.8,
      };
    }
  }

  if (questionLower.includes('order')) {
    const orders = analyticsData.orders;
    if (orders) {
      return {
        answer: `Total orders are ${orders.total?.toLocaleString() || 0}. ` +
                `Average order value is $${orders.avgOrderValue?.toLocaleString() || 0}.`,
        sources: [
          { metric: 'orders', value: orders.total || 0, period: 'current' },
        ],
        confidence: 0.8,
      };
    }
  }

  if (questionLower.includes('customer')) {
    const customers = analyticsData.customers;
    if (customers) {
      return {
        answer: `Total customers are ${customers.total?.toLocaleString() || 0}. ` +
                `New customers: ${customers.new?.toLocaleString() || 0}. ` +
                `Active customers: ${customers.active?.toLocaleString() || 0}.`,
        sources: [
          { metric: 'customers', value: customers.total || 0, period: 'current' },
        ],
        confidence: 0.8,
      };
    }
  }

  return {
    answer: 'I apologize, but I need more information to answer that question. Please try asking about revenue, orders, or customers.',
    sources: [],
    confidence: 0.5,
  };
}

