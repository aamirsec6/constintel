// GENERATOR: ANALYTICS_DASHBOARD
// Segment analytics service for customer segment performance metrics
// HOW TO USE: import { getSegmentAnalytics, getSegmentComparison } from './segmentAnalyticsService'

import { getPrismaClient } from '../../db/prismaClient';
import { getRedisClient } from '../redis/redisClient';

const prisma = getPrismaClient();

export interface SegmentMetrics {
  segment: string;
  size: number;
  growth: number; // Percentage change
  revenue: {
    total: number;
    average: number;
    percentage: number; // Percentage of total revenue
  };
  ltv: {
    average: number;
    median: number;
  };
  churnRate: number;
  engagement: {
    avgOrders: number;
    avgRecency: number; // Days since last order
    activeCustomers: number;
  };
}

export interface SegmentAnalyticsResult {
  segments: SegmentMetrics[];
  summary: {
    totalCustomers: number;
    totalRevenue: number;
    averageLTV: number;
    topSegment: {
      name: string;
      revenue: number;
    };
  };
  trends: {
    segment: string;
    period: string;
    size: number;
    revenue: number;
  }[];
}

const CACHE_PREFIX = 'analytics:segment:';
const CACHE_TTL = 600; // 10 minutes

/**
 * Get cache key for segment analytics
 */
function getCacheKey(brandId: string, startDate: Date, endDate: Date): string {
  return `${CACHE_PREFIX}${brandId}:${startDate.toISOString()}:${endDate.toISOString()}`;
}

/**
 * Get segment analytics
 */
export async function getSegmentAnalytics(
  brandId: string,
  startDate: Date,
  endDate: Date,
  useCache: boolean = true
): Promise<SegmentAnalyticsResult> {
  // Check cache
  if (useCache) {
    try {
      const redis = await getRedisClient();
      const cacheKey = getCacheKey(brandId, startDate, endDate);
      const cached = await redis.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.error('Cache read error:', error);
    }
  }

  // Get all profiles with predictions (segments)
  const profiles = await prisma.customerProfile.findMany({
    where: {
      brandId,
      createdAt: {
        lte: endDate,
      },
    },
    include: {
      predictions: {
        select: {
          segment: true,
          churnScore: true,
          ltvScore: true,
        },
      },
      rawEvents: {
        where: {
          eventType: { in: ['purchase', 'pos_transaction', 'order_placed'] },
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          createdAt: true,
          payload: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  // Group by segment
  const segmentMap = new Map<string, typeof profiles>();
  
  for (const profile of profiles) {
    const segment = profile.predictions?.segment || 'unknown';
    if (!segmentMap.has(segment)) {
      segmentMap.set(segment, []);
    }
    segmentMap.get(segment)!.push(profile);
  }

  // Calculate metrics for each segment
  const segments: SegmentMetrics[] = [];
  let totalRevenue = 0;

  for (const [segment, segmentProfiles] of segmentMap.entries()) {
    const size = segmentProfiles.length;
    
    // Calculate revenue from events
    let segmentRevenue = 0;
    const activeCustomers = new Set<string>();
    const orderCounts: number[] = [];
    const recencies: number[] = [];
    const ltvValues: number[] = [];
    const churnScores: number[] = [];

    for (const profile of segmentProfiles) {
      // Revenue from events
      for (const event of profile.rawEvents) {
        const payload = event.payload as any;
        const amount = parseFloat(payload.total || payload.amount || payload.revenue || '0');
        if (!isNaN(amount) && amount > 0) {
          segmentRevenue += amount;
          activeCustomers.add(profile.id);
        }
      }

      // LTV
      const ltv = parseFloat(profile.lifetimeValue.toString());
      if (ltv > 0) {
        ltvValues.push(ltv);
      }

      // Order count
      if (profile.totalOrders > 0) {
        orderCounts.push(profile.totalOrders);
      }

      // Recency (days since last order)
      if (profile.rawEvents.length > 0) {
        const lastOrderDate = profile.rawEvents[0].createdAt;
        const daysSince = Math.ceil((endDate.getTime() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24));
        recencies.push(daysSince);
      }

      // Churn score
      if (profile.predictions?.churnScore !== null && profile.predictions?.churnScore !== undefined) {
        churnScores.push(profile.predictions.churnScore);
      }
    }

    totalRevenue += segmentRevenue;

    // Calculate averages
    const avgLTV = ltvValues.length > 0
      ? ltvValues.reduce((a, b) => a + b, 0) / ltvValues.length
      : 0;

    const medianLTV = ltvValues.length > 0
      ? [...ltvValues].sort((a, b) => a - b)[Math.floor(ltvValues.length / 2)]
      : 0;

    const avgOrders = orderCounts.length > 0
      ? orderCounts.reduce((a, b) => a + b, 0) / orderCounts.length
      : 0;

    const avgRecency = recencies.length > 0
      ? recencies.reduce((a, b) => a + b, 0) / recencies.length
      : 0;

    const avgChurnScore = churnScores.length > 0
      ? (churnScores.reduce((a, b) => a + b, 0) / churnScores.length) * 100
      : 0;

    segments.push({
      segment,
      size,
      growth: 0, // Will calculate separately if needed
      revenue: {
        total: Math.round(segmentRevenue * 100) / 100,
        average: size > 0 ? Math.round((segmentRevenue / size) * 100) / 100 : 0,
        percentage: 0, // Will calculate after total revenue is known
      },
      ltv: {
        average: Math.round(avgLTV * 100) / 100,
        median: Math.round(medianLTV * 100) / 100,
      },
      churnRate: Math.round(avgChurnScore * 100) / 100,
      engagement: {
        avgOrders: Math.round(avgOrders * 100) / 100,
        avgRecency: Math.round(avgRecency * 100) / 100,
        activeCustomers: activeCustomers.size,
      },
    });
  }

  // Calculate revenue percentages and total metrics
  const totalCustomers = profiles.length;
  const averageLTV = totalCustomers > 0
    ? segments.reduce((sum, s) => sum + (s.ltv.average * s.size), 0) / totalCustomers
    : 0;

  // Update revenue percentages
  for (const segment of segments) {
    segment.revenue.percentage = totalRevenue > 0
      ? Math.round((segment.revenue.total / totalRevenue) * 10000) / 100
      : 0;
  }

  // Find top segment by revenue
  const topSegment = segments.reduce((top, s) => 
    s.revenue.total > (top?.revenue.total || 0) ? s : top,
    segments[0]
  ) || { segment: 'unknown', revenue: { total: 0 } };

  // Calculate trends (simplified - can be enhanced with time-based data)
  const trends = segments.map(s => ({
    segment: s.segment,
    period: endDate.toISOString().slice(0, 7), // Current month
    size: s.size,
    revenue: s.revenue.total,
  }));

  const result: SegmentAnalyticsResult = {
    segments: segments.sort((a, b) => b.revenue.total - a.revenue.total),
    summary: {
      totalCustomers,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      averageLTV: Math.round(averageLTV * 100) / 100,
      topSegment: {
        name: topSegment.segment,
        revenue: topSegment.revenue.total,
      },
    },
    trends,
  };

  // Cache result
  if (useCache) {
    try {
      const redis = await getRedisClient();
      const cacheKey = getCacheKey(brandId, startDate, endDate);
      await redis.setEx(cacheKey, CACHE_TTL, JSON.stringify(result));
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }

  return result;
}
