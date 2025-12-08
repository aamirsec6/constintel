// GENERATOR: OLLAMA_INTEGRATION
// Analytics insights generation service using LLM
// ASSUMPTIONS: ML service LLM endpoints available, Redis for caching
// HOW TO USE: import { generateInsights } from './insightsService'

import axios from 'axios';
import { getRedisClient } from '../redis/redisClient';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || process.env.NEXT_PUBLIC_ML_API_URL || 'http://localhost:8000';
const LLM_ENABLED = process.env.ENABLE_LLM_INSIGHTS === 'true';

export interface Insight {
  title: string;
  description: string;
  type: 'positive' | 'negative' | 'neutral';
  metric: 'revenue' | 'orders' | 'customers' | 'segments';
  impact: 'high' | 'medium' | 'low';
}

export interface InsightsResult {
  insights: Insight[];
  generatedAt: string;
}

/**
 * Generate natural language insights from analytics data
 */
export async function generateInsights(
  brandId: string,
  dateRange: { startDate: Date; endDate: Date },
  analyticsData: {
    revenue?: any;
    orders?: any;
    customers?: any;
    segments?: any;
  }
): Promise<InsightsResult> {
  if (!LLM_ENABLED) {
    // Return fallback insights if LLM is disabled
    return getFallbackInsights(analyticsData, dateRange);
  }

  // Check cache first
  const cacheKey = `insights:${brandId}:${dateRange.startDate.toISOString()}:${dateRange.endDate.toISOString()}`;
  
  try {
    const redis = await getRedisClient();
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.warn('Redis cache not available for insights:', error);
  }

  try {
    // Call ML service LLM endpoint
    const response = await axios.post(`${ML_SERVICE_URL}/llm/insights`, {
      revenue: analyticsData.revenue || {},
      orders: analyticsData.orders || {},
      customers: analyticsData.customers || {},
      segments: analyticsData.segments || {},
      dateRange: {
        startDate: dateRange.startDate.toISOString().split('T')[0],
        endDate: dateRange.endDate.toISOString().split('T')[0],
      },
    }, {
      timeout: 30000, // 30 second timeout
    });

    if (response.data.success && response.data.data?.insights) {
      const result: InsightsResult = {
        insights: response.data.data.insights,
        generatedAt: response.data.data.generatedAt || new Date().toISOString(),
      };

      // Cache the result (5 minute TTL)
      try {
        const redis = await getRedisClient();
        await redis.setex(cacheKey, 300, JSON.stringify(result));
      } catch (error) {
        console.warn('Failed to cache insights:', error);
      }

      return result;
    }

    // Fallback if LLM response is invalid
    return getFallbackInsights(analyticsData, dateRange);
  } catch (error: any) {
    console.error('Error generating insights from LLM:', error.message);
    // Return fallback insights if LLM fails
    return getFallbackInsights(analyticsData, dateRange);
  }
}

/**
 * Generate fallback insights when LLM is unavailable
 */
function getFallbackInsights(
  analyticsData: any,
  dateRange: { startDate: Date; endDate: Date }
): InsightsResult {
  const insights: Insight[] = [];
  
  // Revenue insight
  if (analyticsData.revenue) {
    const growth = analyticsData.revenue.growth || 0;
    if (growth > 10) {
      insights.push({
        title: 'Strong Revenue Growth',
        description: `Revenue has increased by ${growth.toFixed(1)}% during this period, indicating positive business performance.`,
        type: 'positive',
        metric: 'revenue',
        impact: 'high',
      });
    } else if (growth < -10) {
      insights.push({
        title: 'Revenue Decline Detected',
        description: `Revenue has decreased by ${Math.abs(growth).toFixed(1)}% during this period. Consider investigating the causes.`,
        type: 'negative',
        metric: 'revenue',
        impact: 'high',
      });
    }
  }

  // Orders insight
  if (analyticsData.orders) {
    const avgOrderValue = analyticsData.orders.avgOrderValue || 0;
    insights.push({
      title: 'Average Order Value',
      description: `The average order value is $${avgOrderValue.toFixed(2)}. Consider strategies to increase this metric.`,
      type: 'neutral',
      metric: 'orders',
      impact: 'medium',
    });
  }

  // Customers insight
  if (analyticsData.customers) {
    const newCustomers = analyticsData.customers.new || 0;
    if (newCustomers > 0) {
      insights.push({
        title: 'New Customer Acquisition',
        description: `${newCustomers} new customers were acquired during this period.`,
        type: 'positive',
        metric: 'customers',
        impact: 'medium',
      });
    }
  }

  return {
    insights: insights.slice(0, 5), // Limit to 5 insights
    generatedAt: new Date().toISOString(),
  };
}

