// GENERATOR: SIRI_LIKE_LLM
// Proactive insights service for pattern analysis
// ASSUMPTIONS: Analytics services available, Redis for caching
// HOW TO USE: import { getProactiveInsights } from './proactiveInsightsService'

import { getTimeSeriesData } from './timeSeriesService';
import { getSegmentAnalytics } from './segmentAnalyticsService';
import { getRedisClient } from '../redis/redisClient';

const PROACTIVE_INSIGHTS_TTL = 900; // 15 minutes

export interface ProactiveInsight {
  type: 'anomaly' | 'trend' | 'opportunity' | 'warning';
  title: string;
  description: string;
  metric: string;
  value: number;
  suggestedQuestion?: string;
}

/**
 * Analyze data for proactive insights
 */
export async function getProactiveInsights(
  brandId: string,
  dateRange: { startDate: Date; endDate: Date }
): Promise<ProactiveInsight[]> {
  // Check cache first
  const cacheKey = `proactive_insights:${brandId}:${dateRange.startDate.toISOString()}:${dateRange.endDate.toISOString()}`;
  
  try {
    const redis = await getRedisClient();
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.warn('Redis cache not available for proactive insights:', error);
  }

  const insights: ProactiveInsight[] = [];

  try {
    // Get revenue data
    const revenueData = await getTimeSeriesData(
      brandId,
      'revenue',
      dateRange.startDate,
      dateRange.endDate,
      'day'
    );

    // Check for significant growth
    if (revenueData.summary.growth > 20) {
      insights.push({
        type: 'trend',
        title: 'Strong Revenue Growth',
        description: `Revenue has grown by ${revenueData.summary.growth.toFixed(1)}% during this period. This is a positive trend worth investigating.`,
        metric: 'revenue',
        value: revenueData.summary.growth,
        suggestedQuestion: 'What factors contributed to this revenue growth?',
      });
    } else if (revenueData.summary.growth < -10) {
      insights.push({
        type: 'warning',
        title: 'Revenue Decline Detected',
        description: `Revenue has declined by ${Math.abs(revenueData.summary.growth).toFixed(1)}% during this period. This may require attention.`,
        metric: 'revenue',
        value: revenueData.summary.growth,
        suggestedQuestion: 'What caused the revenue decline?',
      });
    }

    // Get orders data
    const ordersData = await getTimeSeriesData(
      brandId,
      'orders',
      dateRange.startDate,
      dateRange.endDate,
      'day'
    );

    // Check AOV trends
    const avgOrderValue = revenueData.summary.total / (ordersData.summary.total || 1);
    if (avgOrderValue > 0) {
      // Compare with historical average (simplified - would need historical data)
      insights.push({
        type: 'opportunity',
        title: 'Average Order Value Analysis',
        description: `Current average order value is $${avgOrderValue.toFixed(2)}. Consider strategies to increase this metric.`,
        metric: 'orders',
        value: avgOrderValue,
        suggestedQuestion: 'How can we increase the average order value?',
      });
    }

    // Get segment analytics
    const segments = await getSegmentAnalytics(
      brandId,
      dateRange.startDate,
      dateRange.endDate
    );

    if (segments && segments.segments && segments.segments.length > 0) {
      // Find largest segment
      const largestSegment = segments.segments.reduce((max: any, seg: any) => {
        return seg.customerCount > (max?.customerCount || 0) ? seg : max;
      }, segments.segments[0]);

      // Find highest value segment
      const highestValueSegment = segments.segments.reduce((max: any, seg: any) => {
        return seg.revenue > (max?.revenue || 0) ? seg : max;
      }, segments.segments[0]);

      if (largestSegment && highestValueSegment) {
        if (largestSegment.name !== highestValueSegment.name) {
          insights.push({
            type: 'opportunity',
            title: 'Segment Performance Insight',
            description: `The "${largestSegment.name}" segment has the most customers, but "${highestValueSegment.name}" generates the most revenue. Consider upselling strategies.`,
            metric: 'segments',
            value: highestValueSegment.revenue,
            suggestedQuestion: 'Which segment should we focus on for growth?',
          });
        }
      }
    }

    // Cache the insights
    try {
      const redis = await getRedisClient();
      await redis.setex(cacheKey, PROACTIVE_INSIGHTS_TTL, JSON.stringify(insights));
    } catch (error) {
      console.warn('Failed to cache proactive insights:', error);
    }

    return insights;
  } catch (error) {
    console.error('Error generating proactive insights:', error);
    return [];
  }
}

/**
 * Get suggested questions based on data patterns
 */
export async function getSuggestedQuestions(
  brandId: string,
  dateRange: { startDate: Date; endDate: Date }
): Promise<string[]> {
  const insights = await getProactiveInsights(brandId, dateRange);
  
  const questions = insights
    .filter(insight => insight.suggestedQuestion)
    .map(insight => insight.suggestedQuestion!)
    .slice(0, 5); // Limit to 5 questions

  // Add default questions if we don't have enough
  const defaultQuestions = [
    'What are the key trends in revenue?',
    'Which customer segment is performing best?',
    'How has the average order value changed?',
    'What insights can you share about customer behavior?',
  ];

  while (questions.length < 5) {
    const defaultQ = defaultQuestions[questions.length % defaultQuestions.length];
    if (!questions.includes(defaultQ)) {
      questions.push(defaultQ);
    } else {
      break;
    }
  }

  return questions;
}

