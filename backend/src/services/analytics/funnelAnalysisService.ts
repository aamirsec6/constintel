// GENERATOR: ANALYTICS_DASHBOARD
// Funnel analysis service for conversion tracking and drop-off analysis
// HOW TO USE: import { getFunnelAnalysis } from './funnelAnalysisService'

import { getPrismaClient } from '../../db/prismaClient';
import { getRedisClient } from '../redis/redisClient';

const prisma = getPrismaClient();

export type FunnelStage = 'visitor' | 'lead' | 'customer' | 'repeat_customer' | 'vip';

export interface FunnelStageData {
  stage: FunnelStage;
  label: string;
  count: number;
  conversionRate: number; // Percentage from previous stage
  dropOffRate: number; // Percentage lost from previous stage
  avgTimeToConvert?: number; // Days to reach this stage
}

export interface FunnelAnalysisResult {
  stages: FunnelStageData[];
  totalConversionRate: number; // From first to last stage
  summary: {
    totalVisitors: number;
    totalCustomers: number;
    averageTimeToCustomer: number;
    biggestDropOff: {
      stage: string;
      rate: number;
    };
  };
}

const CACHE_PREFIX = 'analytics:funnel:';
const CACHE_TTL = 600; // 10 minutes

/**
 * Get cache key for funnel analysis
 */
function getCacheKey(brandId: string, startDate: Date, endDate: Date): string {
  return `${CACHE_PREFIX}${brandId}:${startDate.toISOString()}:${endDate.toISOString()}`;
}

/**
 * Get funnel analysis
 */
export async function getFunnelAnalysis(
  brandId: string,
  startDate: Date,
  endDate: Date,
  useCache: boolean = true
): Promise<FunnelAnalysisResult> {
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

  // Stage 1: Visitors - All events from brand
  const allEvents = await prisma.customerRawEvent.findMany({
    where: {
      brandId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      id: true,
      eventType: true,
      customerProfileId: true,
      createdAt: true,
    },
  });

  const uniqueVisitors = new Set<string>();
  for (const event of allEvents) {
    if (event.customerProfileId) {
      uniqueVisitors.add(event.customerProfileId);
    } else {
      // Track anonymous visitors by event ID
      uniqueVisitors.add(event.id);
    }
  }
  const visitorCount = uniqueVisitors.size;

  // Stage 2: Leads - Customers with email/phone captured
  const profiles = await prisma.customerProfile.findMany({
    where: {
      brandId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      id: true,
      identifiers: true,
      createdAt: true,
    },
  });

  const leadCount = profiles.filter(p => {
    const ids = p.identifiers as any;
    return (ids.email && ids.email !== '') || (ids.phone && ids.phone !== '');
  }).length;

  // Stage 3: Customers - First purchase
  const firstPurchases = await prisma.$queryRaw<Array<{
    customerProfileId: string;
    firstPurchaseDate: Date;
  }>>`
    SELECT DISTINCT ON (customer_profile_id)
      customer_profile_id as "customerProfileId",
      created_at as "firstPurchaseDate"
    FROM customer_raw_event
    WHERE brand_id = ${brandId}
      AND event_type IN ('purchase', 'pos_transaction', 'order_placed')
      AND customer_profile_id IS NOT NULL
      AND created_at >= ${startDate}
      AND created_at <= ${endDate}
    ORDER BY customer_profile_id, created_at ASC
  `;
  const customerCount = firstPurchases.length;

  // Stage 4: Repeat Customers - Customers with 2+ purchases
  const repeatCustomers = await prisma.customerProfile.findMany({
    where: {
      brandId,
      totalOrders: {
        gte: 2,
      },
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      id: true,
    },
  });
  const repeatCustomerCount = repeatCustomers.length;

  // Stage 5: VIP/High-Value - Customers with high LTV or many orders
  const vipCustomers = await prisma.customerProfile.findMany({
    where: {
      brandId,
      OR: [
        { lifetimeValue: { gte: 500 } }, // High LTV
        { totalOrders: { gte: 5 } }, // Many orders
      ],
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      id: true,
    },
  });
  const vipCount = vipCustomers.length;

  // Calculate conversion rates and drop-off rates
  const stages: FunnelStageData[] = [
    {
      stage: 'visitor',
      label: 'Visitor',
      count: visitorCount,
      conversionRate: 100, // Starting point
      dropOffRate: 0,
    },
    {
      stage: 'lead',
      label: 'Lead (Email/Phone Captured)',
      count: leadCount,
      conversionRate: visitorCount > 0 ? Math.round((leadCount / visitorCount) * 10000) / 100 : 0,
      dropOffRate: visitorCount > 0 ? Math.round(((visitorCount - leadCount) / visitorCount) * 10000) / 100 : 0,
    },
    {
      stage: 'customer',
      label: 'Customer (First Purchase)',
      count: customerCount,
      conversionRate: leadCount > 0 ? Math.round((customerCount / leadCount) * 10000) / 100 : 0,
      dropOffRate: leadCount > 0 ? Math.round(((leadCount - customerCount) / leadCount) * 10000) / 100 : 0,
    },
    {
      stage: 'repeat_customer',
      label: 'Repeat Customer (2+ Orders)',
      count: repeatCustomerCount,
      conversionRate: customerCount > 0 ? Math.round((repeatCustomerCount / customerCount) * 10000) / 100 : 0,
      dropOffRate: customerCount > 0 ? Math.round(((customerCount - repeatCustomerCount) / customerCount) * 10000) / 100 : 0,
    },
    {
      stage: 'vip',
      label: 'VIP/High-Value Customer',
      count: vipCount,
      conversionRate: customerCount > 0 ? Math.round((vipCount / customerCount) * 10000) / 100 : 0,
      dropOffRate: customerCount > 0 ? Math.round(((customerCount - vipCount) / customerCount) * 10000) / 100 : 0,
    },
  ];

  // Calculate average time to convert
  if (firstPurchases.length > 0) {
    let totalDays = 0;
    for (const purchase of firstPurchases) {
      const profile = profiles.find(p => p.id === purchase.customerProfileId);
      if (profile) {
        const days = Math.ceil(
          (purchase.firstPurchaseDate.getTime() - profile.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        totalDays += days;
      }
    }
    const avgTimeToCustomer = firstPurchases.length > 0 ? Math.round((totalDays / firstPurchases.length) * 100) / 100 : 0;
    stages[2].avgTimeToConvert = avgTimeToCustomer;
  }

  // Find biggest drop-off
  let biggestDropOff = { stage: '', rate: 0 };
  for (let i = 1; i < stages.length; i++) {
    if (stages[i].dropOffRate > biggestDropOff.rate) {
      biggestDropOff = {
        stage: stages[i].label,
        rate: stages[i].dropOffRate,
      };
    }
  }

  const totalConversionRate = visitorCount > 0
    ? Math.round((vipCount / visitorCount) * 10000) / 100
    : 0;

  const result: FunnelAnalysisResult = {
    stages,
    totalConversionRate,
    summary: {
      totalVisitors: visitorCount,
      totalCustomers: customerCount,
      averageTimeToCustomer: stages[2].avgTimeToConvert || 0,
      biggestDropOff,
    },
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
