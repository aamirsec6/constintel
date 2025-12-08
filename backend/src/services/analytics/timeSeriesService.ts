// GENERATOR: ANALYTICS_DASHBOARD
// Time series analytics service for revenue, orders, customers over time
// HOW TO USE: import { getTimeSeriesData } from './timeSeriesService'

import { getPrismaClient } from '../../db/prismaClient';
import { getRedisClient } from '../redis/redisClient';

const prisma = getPrismaClient();

export type TimeGranularity = 'hour' | 'day' | 'week' | 'month';
export type MetricType = 'revenue' | 'orders' | 'customers' | 'avgOrderValue' | 'ltv';

export interface TimeSeriesPoint {
  date: string;
  value: number;
  label?: string;
}

export interface TimeSeriesData {
  metric: MetricType;
  granularity: TimeGranularity;
  data: TimeSeriesPoint[];
  summary: {
    total: number;
    average: number;
    min: number;
    max: number;
    growth?: number; // Percentage change from previous period
  };
}

const CACHE_PREFIX = 'analytics:timeseries:';
const CACHE_TTL = 300; // 5 minutes

/**
 * Get cache key for time series data
 */
function getCacheKey(brandId: string, metric: MetricType, granularity: TimeGranularity, startDate: Date, endDate: Date): string {
  return `${CACHE_PREFIX}${metric}:${granularity}:${brandId}:${startDate.toISOString()}:${endDate.toISOString()}`;
}

/**
 * Format date based on granularity
 */
function formatDate(date: Date, granularity: TimeGranularity): string {
  const d = new Date(date);
  switch (granularity) {
    case 'hour':
      return d.toISOString().slice(0, 13) + ':00:00';
    case 'day':
      return d.toISOString().slice(0, 10);
    case 'week':
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      return weekStart.toISOString().slice(0, 10);
    case 'month':
      return d.toISOString().slice(0, 7);
    default:
      return d.toISOString().slice(0, 10);
  }
}

/**
 * Get time series data for revenue
 */
async function getRevenueTimeSeries(
  brandId: string,
  startDate: Date,
  endDate: Date,
  granularity: TimeGranularity
): Promise<TimeSeriesPoint[]> {
  // Query raw events for purchase events
  const events = await prisma.customerRawEvent.findMany({
    where: {
      brandId,
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
  });

  // Group by time period
  const grouped = new Map<string, number>();
  
  for (const event of events) {
    const period = formatDate(event.createdAt, granularity);
    const payload = event.payload as any;
    const amount = parseFloat(payload.total || payload.amount || payload.revenue || '0');
    
    if (!isNaN(amount)) {
      grouped.set(period, (grouped.get(period) || 0) + amount);
    }
  }

  // Convert to array and sort by date
  return Array.from(grouped.entries())
    .map(([date, value]) => ({ date, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Get time series data for order count
 */
async function getOrdersTimeSeries(
  brandId: string,
  startDate: Date,
  endDate: Date,
  granularity: TimeGranularity
): Promise<TimeSeriesPoint[]> {
  const events = await prisma.customerRawEvent.findMany({
    where: {
      brandId,
      eventType: { in: ['purchase', 'pos_transaction', 'order_placed'] },
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      createdAt: true,
    },
  });

  const grouped = new Map<string, number>();
  
  for (const event of events) {
    const period = formatDate(event.createdAt, granularity);
    grouped.set(period, (grouped.get(period) || 0) + 1);
  }

  return Array.from(grouped.entries())
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Get time series data for customer count
 */
async function getCustomersTimeSeries(
  brandId: string,
  startDate: Date,
  endDate: Date,
  granularity: TimeGranularity
): Promise<TimeSeriesPoint[]> {
  // Get unique customers per period
  const events = await prisma.customerRawEvent.findMany({
    where: {
      brandId,
      eventType: { in: ['purchase', 'pos_transaction', 'order_placed', 'profile_created'] },
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      createdAt: true,
      customerProfileId: true,
    },
  });

  const grouped = new Map<string, Set<string>>();
  
  for (const event of events) {
    if (event.customerProfileId) {
      const period = formatDate(event.createdAt, granularity);
      if (!grouped.has(period)) {
        grouped.set(period, new Set());
      }
      grouped.get(period)!.add(event.customerProfileId);
    }
  }

  return Array.from(grouped.entries())
    .map(([date, customers]) => ({ date, value: customers.size }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Get time series data for average order value
 */
async function getAvgOrderValueTimeSeries(
  brandId: string,
  startDate: Date,
  endDate: Date,
  granularity: TimeGranularity
): Promise<TimeSeriesPoint[]> {
  const revenue = await getRevenueTimeSeries(brandId, startDate, endDate, granularity);
  const orders = await getOrdersTimeSeries(brandId, startDate, endDate, granularity);

  const revenueMap = new Map(revenue.map(p => [p.date, p.value]));
  const ordersMap = new Map(orders.map(p => [p.date, p.value]));

  const result: TimeSeriesPoint[] = [];
  const allDates = new Set([...revenueMap.keys(), ...ordersMap.keys()]);

  for (const date of Array.from(allDates).sort()) {
    const rev = revenueMap.get(date) || 0;
    const ord = ordersMap.get(date) || 0;
    const avg = ord > 0 ? Math.round((rev / ord) * 100) / 100 : 0;
    result.push({ date, value: avg });
  }

  return result;
}

/**
 * Get time series data for LTV trends
 */
async function getLTVTimeSeries(
  brandId: string,
  startDate: Date,
  endDate: Date,
  granularity: TimeGranularity
): Promise<TimeSeriesPoint[]> {
  // Use BrandMetrics if available, otherwise calculate from profiles
  const metrics = await prisma.brandMetrics.findMany({
    where: {
      brandId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      date: true,
      revenue: true,
      customerCount: true,
    },
    orderBy: {
      date: 'asc',
    },
  });

  if (metrics.length > 0) {
    const grouped = new Map<string, { totalRevenue: number; totalCustomers: number }>();
    
    for (const metric of metrics) {
      const period = formatDate(metric.date, granularity);
      const existing = grouped.get(period) || { totalRevenue: 0, totalCustomers: 0 };
      grouped.set(period, {
        totalRevenue: existing.totalRevenue + parseFloat(metric.revenue.toString()),
        totalCustomers: Math.max(existing.totalCustomers, metric.customerCount),
      });
    }

    return Array.from(grouped.entries())
      .map(([date, data]) => ({
        date,
        value: data.totalCustomers > 0
          ? Math.round((data.totalRevenue / data.totalCustomers) * 100) / 100
          : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  // Fallback: calculate from customer profiles
  const profiles = await prisma.customerProfile.findMany({
    where: {
      brandId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      createdAt: true,
      lifetimeValue: true,
    },
  });

  const grouped = new Map<string, number[]>();
  
  for (const profile of profiles) {
    const period = formatDate(profile.createdAt, granularity);
    if (!grouped.has(period)) {
      grouped.set(period, []);
    }
    grouped.get(period)!.push(parseFloat(profile.lifetimeValue.toString()));
  }

  return Array.from(grouped.entries())
    .map(([date, values]) => ({
      date,
      value: values.length > 0
        ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100
        : 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Calculate summary statistics
 */
function calculateSummary(data: TimeSeriesPoint[], previousData?: TimeSeriesPoint[]): TimeSeriesData['summary'] {
  const values = data.map(p => p.value).filter(v => !isNaN(v) && isFinite(v));
  
  if (values.length === 0) {
    return {
      total: 0,
      average: 0,
      min: 0,
      max: 0,
    };
  }

  const total = values.reduce((a, b) => a + b, 0);
  const average = total / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);

  let growth: number | undefined;
  if (previousData && previousData.length > 0) {
    const prevValues = previousData.map(p => p.value).filter(v => !isNaN(v) && isFinite(v));
    const prevTotal = prevValues.reduce((a, b) => a + b, 0);
    if (prevTotal > 0) {
      growth = Math.round(((total - prevTotal) / prevTotal) * 10000) / 100;
    }
  }

  return {
    total: Math.round(total * 100) / 100,
    average: Math.round(average * 100) / 100,
    min: Math.round(min * 100) / 100,
    max: Math.round(max * 100) / 100,
    growth,
  };
}

/**
 * Get time series data for a specific metric
 */
export async function getTimeSeriesData(
  brandId: string,
  metric: MetricType,
  startDate: Date,
  endDate: Date,
  granularity: TimeGranularity = 'day',
  useCache: boolean = true
): Promise<TimeSeriesData> {
  // Check cache
  if (useCache) {
    try {
      const redis = await getRedisClient();
      const cacheKey = getCacheKey(brandId, metric, granularity, startDate, endDate);
      const cached = await redis.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.error('Cache read error:', error);
      // Continue without cache
    }
  }

  // Get data based on metric type
  let data: TimeSeriesPoint[];
  
  switch (metric) {
    case 'revenue':
      data = await getRevenueTimeSeries(brandId, startDate, endDate, granularity);
      break;
    case 'orders':
      data = await getOrdersTimeSeries(brandId, startDate, endDate, granularity);
      break;
    case 'customers':
      data = await getCustomersTimeSeries(brandId, startDate, endDate, granularity);
      break;
    case 'avgOrderValue':
      data = await getAvgOrderValueTimeSeries(brandId, startDate, endDate, granularity);
      break;
    case 'ltv':
      data = await getLTVTimeSeries(brandId, startDate, endDate, granularity);
      break;
    default:
      throw new Error(`Unsupported metric type: ${metric}`);
  }

  // Calculate previous period for growth comparison
  const periodDays = granularity === 'day' ? 1 : granularity === 'week' ? 7 : granularity === 'month' ? 30 : 24;
  const periodMs = periodDays * 24 * 60 * 60 * 1000;
  const previousStartDate = new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime()) - periodMs);
  const previousEndDate = new Date(startDate.getTime() - periodMs);
  
  let previousData: TimeSeriesPoint[] | undefined;
  try {
    switch (metric) {
      case 'revenue':
        previousData = await getRevenueTimeSeries(brandId, previousStartDate, previousEndDate, granularity);
        break;
      case 'orders':
        previousData = await getOrdersTimeSeries(brandId, previousStartDate, previousEndDate, granularity);
        break;
      case 'customers':
        previousData = await getCustomersTimeSeries(brandId, previousStartDate, previousEndDate, granularity);
        break;
      case 'avgOrderValue':
        previousData = await getAvgOrderValueTimeSeries(brandId, previousStartDate, previousEndDate, granularity);
        break;
      case 'ltv':
        previousData = await getLTVTimeSeries(brandId, previousStartDate, previousEndDate, granularity);
        break;
    }
  } catch (error) {
    console.error('Error getting previous period data:', error);
    // Continue without previous data
  }

  const summary = calculateSummary(data, previousData);

  const result: TimeSeriesData = {
    metric,
    granularity,
    data,
    summary,
  };

  // Cache result
  if (useCache) {
    try {
      const redis = await getRedisClient();
      const cacheKey = getCacheKey(brandId, metric, granularity, startDate, endDate);
      await redis.setEx(cacheKey, CACHE_TTL, JSON.stringify(result));
    } catch (error) {
      console.error('Cache write error:', error);
      // Continue without caching
    }
  }

  return result;
}

/**
 * Get multiple metrics at once
 */
export async function getMultipleTimeSeries(
  brandId: string,
  metrics: MetricType[],
  startDate: Date,
  endDate: Date,
  granularity: TimeGranularity = 'day'
): Promise<TimeSeriesData[]> {
  return Promise.all(
    metrics.map(metric => getTimeSeriesData(brandId, metric, startDate, endDate, granularity))
  );
}
