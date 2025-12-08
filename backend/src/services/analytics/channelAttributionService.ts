// GENERATOR: ANALYTICS_DASHBOARD
// Channel attribution service for multi-channel attribution analysis
// HOW TO USE: import { getChannelAttribution } from './channelAttributionService'

import { getPrismaClient } from '../../db/prismaClient';
import { getRedisClient } from '../redis/redisClient';

const prisma = getPrismaClient();

export type AttributionModel = 'first_touch' | 'last_touch' | 'linear' | 'time_decay';

export interface ChannelMetrics {
  channel: string;
  revenue: {
    total: number;
    percentage: number;
  };
  customers: {
    acquired: number;
    percentage: number;
  };
  roi: number; // Return on investment (revenue / cost, simplified)
  avgOrderValue: number;
  conversionRate: number;
}

export interface ChannelAttributionResult {
  attributionModel: AttributionModel;
  channels: ChannelMetrics[];
  summary: {
    totalRevenue: number;
    totalCustomers: number;
    topChannel: {
      name: string;
      revenue: number;
    };
  };
  multiChannelJourney: {
    path: string; // e.g., "web -> whatsapp -> purchase"
    count: number;
    revenue: number;
  }[];
}

const CACHE_PREFIX = 'analytics:channel:';
const CACHE_TTL = 600; // 10 minutes

/**
 * Get cache key for channel attribution
 */
function getCacheKey(brandId: string, model: AttributionModel, startDate: Date, endDate: Date): string {
  return `${CACHE_PREFIX}${model}:${brandId}:${startDate.toISOString()}:${endDate.toISOString()}`;
}

/**
 * Detect channel from event
 */
function detectChannel(event: any): string {
  const payload = event.payload as any;
  
  // Check explicit channel field
  if (payload.channel) {
    return payload.channel.toLowerCase();
  }

  // Detect from event type
  if (event.eventType === 'whatsapp_message' || event.eventType === 'whatsapp_received') {
    return 'whatsapp';
  }
  
  if (event.eventType === 'email_sent' || event.eventType === 'email_opened') {
    return 'email';
  }
  
  if (event.eventType === 'sms_sent') {
    return 'sms';
  }
  
  if (event.eventType === 'pos_transaction') {
    return 'pos';
  }
  
  if (event.eventType === 'page_view' || event.eventType === 'purchase') {
    const source = payload.source || payload.utm_source || payload.referrer;
    if (source) {
      if (source.includes('shopify') || source.includes('woocommerce')) {
        return 'online';
      }
      if (source.includes('whatsapp')) {
        return 'whatsapp';
      }
      return source.toLowerCase();
    }
    return 'online';
  }

  return 'unknown';
}

/**
 * Get channel attribution using first touch model
 */
async function getFirstTouchAttribution(
  brandId: string,
  startDate: Date,
  endDate: Date
): Promise<Map<string, { revenue: number; customers: Set<string> }>> {
  // Get all conversion events (purchases)
  const conversions = await prisma.customerRawEvent.findMany({
    where: {
      brandId,
      eventType: { in: ['purchase', 'pos_transaction', 'order_placed'] },
      customerProfileId: { not: null },
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      customerProfileId: true,
      createdAt: true,
      payload: true,
    },
  });

  const channelMap = new Map<string, { revenue: number; customers: Set<string> }>();

  for (const conversion of conversions) {
    if (!conversion.customerProfileId) continue;

    // Get first touch event for this customer
    const firstEvent = await prisma.customerRawEvent.findFirst({
      where: {
        brandId,
        customerProfileId: conversion.customerProfileId,
        createdAt: {
          lte: conversion.createdAt,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (firstEvent) {
      const channel = detectChannel(firstEvent);
      const payload = conversion.payload as any;
      const revenue = parseFloat(payload.total || payload.amount || payload.revenue || '0');

      if (!channelMap.has(channel)) {
        channelMap.set(channel, { revenue: 0, customers: new Set() });
      }

      const channelData = channelMap.get(channel)!;
      channelData.revenue += revenue;
      channelData.customers.add(conversion.customerProfileId);
    }
  }

  return channelMap;
}

/**
 * Get channel attribution using last touch model
 */
async function getLastTouchAttribution(
  brandId: string,
  startDate: Date,
  endDate: Date
): Promise<Map<string, { revenue: number; customers: Set<string> }>> {
  const conversions = await prisma.customerRawEvent.findMany({
    where: {
      brandId,
      eventType: { in: ['purchase', 'pos_transaction', 'order_placed'] },
      customerProfileId: { not: null },
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      customerProfileId: true,
      createdAt: true,
      payload: true,
    },
  });

  const channelMap = new Map<string, { revenue: number; customers: Set<string> }>();

  for (const conversion of conversions) {
    if (!conversion.customerProfileId) continue;

    // Get events before conversion
    const events = await prisma.customerRawEvent.findMany({
      where: {
        brandId,
        customerProfileId: conversion.customerProfileId,
        createdAt: {
          lt: conversion.createdAt,
          gte: new Date(conversion.createdAt.getTime() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 1,
    });

    const lastEvent = events[0];
    const channel = lastEvent ? detectChannel(lastEvent) : detectChannel(conversion);
    const payload = conversion.payload as any;
    const revenue = parseFloat(payload.total || payload.amount || payload.revenue || '0');

    if (!channelMap.has(channel)) {
      channelMap.set(channel, { revenue: 0, customers: new Set() });
    }

    const channelData = channelMap.get(channel)!;
    channelData.revenue += revenue;
    channelData.customers.add(conversion.customerProfileId);
  }

  return channelMap;
}

/**
 * Get channel attribution
 */
export async function getChannelAttribution(
  brandId: string,
  attributionModel: AttributionModel,
  startDate: Date,
  endDate: Date,
  useCache: boolean = true
): Promise<ChannelAttributionResult> {
  // Check cache
  if (useCache) {
    try {
      const redis = await getRedisClient();
      const cacheKey = getCacheKey(brandId, attributionModel, startDate, endDate);
      const cached = await redis.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.error('Cache read error:', error);
    }
  }

  // Get channel data based on attribution model
  let channelMap: Map<string, { revenue: number; customers: Set<string> }>;
  
  switch (attributionModel) {
    case 'first_touch':
      channelMap = await getFirstTouchAttribution(brandId, startDate, endDate);
      break;
    case 'last_touch':
      channelMap = await getLastTouchAttribution(brandId, startDate, endDate);
      break;
    case 'linear':
    case 'time_decay':
      // Simplified: use last touch for now, can be enhanced
      channelMap = await getLastTouchAttribution(brandId, startDate, endDate);
      break;
    default:
      channelMap = await getLastTouchAttribution(brandId, startDate, endDate);
  }

  // Calculate total metrics
  let totalRevenue = 0;
  const allCustomers = new Set<string>();
  
  for (const [channel, data] of channelMap.entries()) {
    totalRevenue += data.revenue;
    data.customers.forEach(id => allCustomers.add(id));
  }

  // Build channel metrics
  const channels: ChannelMetrics[] = [];
  
  for (const [channel, data] of channelMap.entries()) {
    const customerCount = data.customers.size;
    const revenuePercentage = totalRevenue > 0
      ? Math.round((data.revenue / totalRevenue) * 10000) / 100
      : 0;
    
    const customerPercentage = allCustomers.size > 0
      ? Math.round((customerCount / allCustomers.size) * 10000) / 100
      : 0;

    // Get order count for AOV calculation
    const orders = await prisma.customerRawEvent.count({
      where: {
        brandId,
        customerProfileId: { in: Array.from(data.customers) },
        eventType: { in: ['purchase', 'pos_transaction', 'order_placed'] },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const avgOrderValue = orders > 0 ? data.revenue / orders : 0;
    
    // Simplified conversion rate (can be enhanced)
    const conversionRate = customerCount > 0
      ? Math.round((orders / customerCount) * 10000) / 100
      : 0;

    channels.push({
      channel,
      revenue: {
        total: Math.round(data.revenue * 100) / 100,
        percentage: revenuePercentage,
      },
      customers: {
        acquired: customerCount,
        percentage: customerPercentage,
      },
      roi: 0, // Would need cost data
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      conversionRate,
    });
  }

  // Find top channel
  const topChannel = channels.reduce((top, c) =>
    c.revenue.total > (top?.revenue.total || 0) ? c : top,
    channels[0]
  ) || { channel: 'unknown', revenue: { total: 0 } };

  // Multi-channel journey (simplified)
  const multiChannelJourney: ChannelAttributionResult['multiChannelJourney'] = [];

  const result: ChannelAttributionResult = {
    attributionModel,
    channels: channels.sort((a, b) => b.revenue.total - a.revenue.total),
    summary: {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalCustomers: allCustomers.size,
      topChannel: {
        name: topChannel.channel,
        revenue: topChannel.revenue.total,
      },
    },
    multiChannelJourney,
  };

  // Cache result
  if (useCache) {
    try {
      const redis = await getRedisClient();
      const cacheKey = getCacheKey(brandId, attributionModel, startDate, endDate);
      await redis.setEx(cacheKey, CACHE_TTL, JSON.stringify(result));
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }

  return result;
}
