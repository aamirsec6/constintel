// GENERATOR: ANALYTICS_DASHBOARD
// Cohort analysis service for retention and revenue per cohort
// HOW TO USE: import { getCohortAnalysis, getCohortRetention } from './cohortAnalysisService'

import { getPrismaClient } from '../../db/prismaClient';
import { getRedisClient } from '../redis/redisClient';

const prisma = getPrismaClient();

export type CohortType = 'acquisition' | 'first_purchase' | 'segment';

export interface CohortData {
  cohortPeriod: string; // e.g., "2024-01", "Week 1"
  cohortSize: number;
  metrics: {
    retention: {
      d1?: number;
      d7?: number;
      d30?: number;
      d90?: number;
      d180?: number;
      d365?: number;
    };
    revenue: {
      total: number;
      average: number;
      perCustomer: number;
    };
    ltv: number;
    avgOrderValue: number;
  };
}

export interface CohortAnalysisResult {
  cohortType: CohortType;
  cohorts: CohortData[];
  summary: {
    totalCohorts: number;
    totalCustomers: number;
    averageRetention: {
      d1: number;
      d7: number;
      d30: number;
      d90: number;
    };
  };
}

const CACHE_PREFIX = 'analytics:cohort:';
const CACHE_TTL = 600; // 10 minutes

/**
 * Get cache key for cohort analysis
 */
function getCacheKey(brandId: string, cohortType: CohortType, startDate: Date, endDate: Date): string {
  return `${CACHE_PREFIX}${cohortType}:${brandId}:${startDate.toISOString()}:${endDate.toISOString()}`;
}

/**
 * Format cohort period based on cohort type
 */
function formatCohortPeriod(date: Date, cohortType: CohortType): string {
  const d = new Date(date);
  
  switch (cohortType) {
    case 'acquisition':
      // Monthly cohorts
      return d.toISOString().slice(0, 7); // YYYY-MM
    case 'first_purchase':
      // Weekly cohorts
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const weekNum = Math.ceil(weekStart.getDate() / 7);
      return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
    case 'segment':
      // This will be handled differently
      return d.toISOString().slice(0, 7);
    default:
      return d.toISOString().slice(0, 7);
  }
}

/**
 * Calculate days between two dates
 */
function daysBetween(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get acquisition cohorts (by signup date)
 */
async function getAcquisitionCohorts(
  brandId: string,
  startDate: Date,
  endDate: Date
): Promise<CohortData[]> {
  // Get all profiles created in the date range
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
      createdAt: true,
      lifetimeValue: true,
      totalOrders: true,
    },
  });

  // Group by cohort period
  const cohortMap = new Map<string, typeof profiles>();
  
  for (const profile of profiles) {
    const period = formatCohortPeriod(profile.createdAt, 'acquisition');
    if (!cohortMap.has(period)) {
      cohortMap.set(period, []);
    }
    cohortMap.get(period)!.push(profile);
  }

  // Get all purchase events for retention calculation
  const allEvents = await prisma.customerRawEvent.findMany({
    where: {
      brandId,
      eventType: { in: ['purchase', 'pos_transaction', 'order_placed'] },
      customerProfileId: { not: null },
      createdAt: {
        gte: startDate,
      },
    },
    select: {
      customerProfileId: true,
      createdAt: true,
      payload: true,
    },
  });

  // Build cohort data
  const cohorts: CohortData[] = [];
  
  for (const [period, cohortProfiles] of cohortMap.entries()) {
    const cohortDate = new Date(period + '-01');
    const cohortSize = cohortProfiles.length;
    
    // Calculate retention at different intervals
    const retention: CohortData['metrics']['retention'] = {};
    const profileIds = new Set(cohortProfiles.map(p => p.id));
    
    // Check retention at different days
    const retentionDays = [1, 7, 30, 90, 180, 365];
    
    for (const days of retentionDays) {
      const targetDate = new Date(cohortDate);
      targetDate.setDate(targetDate.getDate() + days);
      
      const activeProfiles = new Set<string>();
      
      for (const event of allEvents) {
        if (event.customerProfileId && profileIds.has(event.customerProfileId)) {
          if (event.createdAt >= cohortDate && event.createdAt <= targetDate) {
            activeProfiles.add(event.customerProfileId);
          }
        }
      }
      
      const retentionRate = cohortSize > 0 ? (activeProfiles.size / cohortSize) * 100 : 0;
      
      if (days === 1) retention.d1 = Math.round(retentionRate * 100) / 100;
      else if (days === 7) retention.d7 = Math.round(retentionRate * 100) / 100;
      else if (days === 30) retention.d30 = Math.round(retentionRate * 100) / 100;
      else if (days === 90) retention.d90 = Math.round(retentionRate * 100) / 100;
      else if (days === 180) retention.d180 = Math.round(retentionRate * 100) / 100;
      else if (days === 365) retention.d365 = Math.round(retentionRate * 100) / 100;
    }
    
    // Calculate revenue metrics
    let totalRevenue = 0;
    let totalOrders = 0;
    
    for (const profile of cohortProfiles) {
      totalRevenue += parseFloat(profile.lifetimeValue.toString());
      totalOrders += profile.totalOrders;
    }
    
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const avgLTV = cohortSize > 0 ? totalRevenue / cohortSize : 0;
    
    cohorts.push({
      cohortPeriod: period,
      cohortSize,
      metrics: {
        retention,
        revenue: {
          total: Math.round(totalRevenue * 100) / 100,
          average: Math.round((totalRevenue / cohortSize) * 100) / 100,
          perCustomer: Math.round((totalRevenue / cohortSize) * 100) / 100,
        },
        ltv: Math.round(avgLTV * 100) / 100,
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      },
    });
  }
  
  return cohorts.sort((a, b) => a.cohortPeriod.localeCompare(b.cohortPeriod));
}

/**
 * Get first purchase cohorts
 */
async function getFirstPurchaseCohorts(
  brandId: string,
  startDate: Date,
  endDate: Date
): Promise<CohortData[]> {
  // Get first purchase events for each customer
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
  
  // Group by cohort period
  const cohortMap = new Map<string, string[]>();
  
  for (const purchase of firstPurchases) {
    const period = formatCohortPeriod(purchase.firstPurchaseDate, 'first_purchase');
    if (!cohortMap.has(period)) {
      cohortMap.set(period, []);
    }
    cohortMap.get(period)!.push(purchase.customerProfileId);
  }
  
  // Build cohort data (similar to acquisition cohorts)
  const cohorts: CohortData[] = [];
  
  // Get profile data and events for calculations
  const allProfiles = await prisma.customerProfile.findMany({
    where: {
      brandId,
      id: { in: firstPurchases.map(p => p.customerProfileId) },
    },
    select: {
      id: true,
      lifetimeValue: true,
      totalOrders: true,
    },
  });
  
  const profileMap = new Map(allProfiles.map(p => [p.id, p]));
  
  for (const [period, profileIds] of cohortMap.entries()) {
    const cohortProfiles = profileIds.map(id => profileMap.get(id)).filter(Boolean) as typeof allProfiles;
    const cohortSize = cohortProfiles.length;
    
    if (cohortSize === 0) continue;
    
    // Calculate metrics
    let totalRevenue = 0;
    let totalOrders = 0;
    
    for (const profile of cohortProfiles) {
      totalRevenue += parseFloat(profile.lifetimeValue.toString());
      totalOrders += profile.totalOrders;
    }
    
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const avgLTV = cohortSize > 0 ? totalRevenue / cohortSize : 0;
    
    cohorts.push({
      cohortPeriod: period,
      cohortSize,
      metrics: {
        retention: {}, // Simplified - can be enhanced
        revenue: {
          total: Math.round(totalRevenue * 100) / 100,
          average: Math.round((totalRevenue / cohortSize) * 100) / 100,
          perCustomer: Math.round((totalRevenue / cohortSize) * 100) / 100,
        },
        ltv: Math.round(avgLTV * 100) / 100,
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      },
    });
  }
  
  return cohorts.sort((a, b) => a.cohortPeriod.localeCompare(b.cohortPeriod));
}

/**
 * Get segment-based cohorts
 */
async function getSegmentCohorts(
  brandId: string,
  startDate: Date,
  endDate: Date
): Promise<CohortData[]> {
  // Get profiles with predictions (segments)
  const profiles = await prisma.customerProfile.findMany({
    where: {
      brandId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      predictions: {
        select: {
          segment: true,
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
  
  // Build cohort data
  const cohorts: CohortData[] = [];
  
  for (const [segment, cohortProfiles] of segmentMap.entries()) {
    const cohortSize = cohortProfiles.length;
    
    let totalRevenue = 0;
    let totalOrders = 0;
    
    for (const profile of cohortProfiles) {
      totalRevenue += parseFloat(profile.lifetimeValue.toString());
      totalOrders += profile.totalOrders;
    }
    
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const avgLTV = cohortSize > 0 ? totalRevenue / cohortSize : 0;
    
    cohorts.push({
      cohortPeriod: segment,
      cohortSize,
      metrics: {
        retention: {},
        revenue: {
          total: Math.round(totalRevenue * 100) / 100,
          average: Math.round((totalRevenue / cohortSize) * 100) / 100,
          perCustomer: Math.round((totalRevenue / cohortSize) * 100) / 100,
        },
        ltv: Math.round(avgLTV * 100) / 100,
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      },
    });
  }
  
  return cohorts.sort((a, b) => a.cohortPeriod.localeCompare(b.cohortPeriod));
}

/**
 * Calculate summary statistics
 */
function calculateCohortSummary(cohorts: CohortData[]): CohortAnalysisResult['summary'] {
  const totalCohorts = cohorts.length;
  const totalCustomers = cohorts.reduce((sum, c) => sum + c.cohortSize, 0);
  
  // Calculate average retention rates
  const retentionSums = {
    d1: 0,
    d7: 0,
    d30: 0,
    d90: 0,
  };
  
  let retentionCount = 0;
  
  for (const cohort of cohorts) {
    const ret = cohort.metrics.retention;
    if (ret.d1 !== undefined) {
      retentionSums.d1 += ret.d1;
      retentionSums.d7 += ret.d7 || 0;
      retentionSums.d30 += ret.d30 || 0;
      retentionSums.d90 += ret.d90 || 0;
      retentionCount++;
    }
  }
  
  return {
    totalCohorts,
    totalCustomers,
    averageRetention: {
      d1: retentionCount > 0 ? Math.round((retentionSums.d1 / retentionCount) * 100) / 100 : 0,
      d7: retentionCount > 0 ? Math.round((retentionSums.d7 / retentionCount) * 100) / 100 : 0,
      d30: retentionCount > 0 ? Math.round((retentionSums.d30 / retentionCount) * 100) / 100 : 0,
      d90: retentionCount > 0 ? Math.round((retentionSums.d90 / retentionCount) * 100) / 100 : 0,
    },
  };
}

/**
 * Get cohort analysis
 */
export async function getCohortAnalysis(
  brandId: string,
  cohortType: CohortType,
  startDate: Date,
  endDate: Date,
  useCache: boolean = true
): Promise<CohortAnalysisResult> {
  // Check cache
  if (useCache) {
    try {
      const redis = await getRedisClient();
      const cacheKey = getCacheKey(brandId, cohortType, startDate, endDate);
      const cached = await redis.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.error('Cache read error:', error);
    }
  }

  // Get cohorts based on type
  let cohorts: CohortData[];
  
  switch (cohortType) {
    case 'acquisition':
      cohorts = await getAcquisitionCohorts(brandId, startDate, endDate);
      break;
    case 'first_purchase':
      cohorts = await getFirstPurchaseCohorts(brandId, startDate, endDate);
      break;
    case 'segment':
      cohorts = await getSegmentCohorts(brandId, startDate, endDate);
      break;
    default:
      throw new Error(`Unsupported cohort type: ${cohortType}`);
  }

  const summary = calculateCohortSummary(cohorts);

  const result: CohortAnalysisResult = {
    cohortType,
    cohorts,
    summary,
  };

  // Cache result
  if (useCache) {
    try {
      const redis = await getRedisClient();
      const cacheKey = getCacheKey(brandId, cohortType, startDate, endDate);
      await redis.setEx(cacheKey, CACHE_TTL, JSON.stringify(result));
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }

  return result;
}
