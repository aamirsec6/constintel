// GENERATOR: AUTH_SYSTEM
// Metrics collection service
// Collects brand performance metrics from various data sources

import { getPrismaClient } from '../../db/prismaClient';

export interface BrandMetricsData {
  brandId: string;
  date: Date;
  revenue: number;
  revenueGrowth?: number;
  mrr?: number;
  customerCount: number;
  newCustomers: number;
  churnRate?: number;
  orderCount: number;
  orderValue: number;
  avgOrderValue?: number;
  engagementScore?: number;
  activeCustomers: number;
  retentionRate?: number;
  mlImpactScore?: number;
  churnReduction?: number;
  ltvIncrease?: number;
  usageScore?: number;
  apiCalls: number;
  featuresUsed: string[];
}

/**
 * Collect metrics for a brand for a specific date
 */
export async function collectBrandMetrics(
  brandId: string,
  date: Date = new Date()
): Promise<BrandMetricsData> {
  const prisma = getPrismaClient();
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const previousDay = new Date(startOfDay);
  previousDay.setDate(previousDay.getDate() - 1);
  const previousDayEnd = new Date(previousDay);
  previousDayEnd.setHours(23, 59, 59, 999);

  // Get previous day metrics for comparison
  const previousMetrics = await prisma.brandMetrics.findUnique({
    where: {
      brandId_date: {
        brandId,
        date: previousDay,
      },
    },
  });

  // Aggregate revenue from customer profiles (lifetime_value updates)
  const profiles = await prisma.customerProfile.findMany({
    where: { brandId },
    select: {
      lifetimeValue: true,
      totalOrders: true,
    },
  });

  const totalRevenue = profiles.reduce((sum, p) => sum + Number(p.lifetimeValue), 0);
  const totalOrders = profiles.reduce((sum, p) => sum + p.totalOrders, 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Get previous revenue for growth calculation
  const previousRevenue = previousMetrics ? Number(previousMetrics.revenue) : 0;
  const revenueGrowth =
    previousRevenue > 0
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
      : undefined;

  // Customer count
  const customerCount = profiles.length;

  // New customers today (profiles created today)
  const newCustomers = await prisma.customerProfile.count({
    where: {
      brandId,
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });

  // Active customers (profiles with orders in last 30 days)
  const thirtyDaysAgo = new Date(date);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const activeCustomers = await prisma.customerProfile.count({
    where: {
      brandId,
      updatedAt: {
        gte: thirtyDaysAgo,
      },
      totalOrders: {
        gt: 0,
      },
    },
  });

  // Engagement score (0-100): based on active customers ratio
  const engagementScore =
    customerCount > 0 ? (activeCustomers / customerCount) * 100 : 0;

  // Orders today
  const ordersToday = await prisma.customerRawEvent.count({
    where: {
      brandId,
      eventType: 'purchase',
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });

  // Order value today (estimate from events)
  const orderEvents = await prisma.customerRawEvent.findMany({
    where: {
      brandId,
      eventType: 'purchase',
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    select: {
      payload: true,
    },
  });

  const orderValueToday = orderEvents.reduce((sum, event) => {
    const payload = event.payload as any;
    const amount = payload.total || payload.amount || payload.value || 0;
    return sum + (typeof amount === 'number' ? amount : parseFloat(amount) || 0);
  }, 0);

  // ML impact: Check predictions table for churn/LTV improvements
  const predictions = await prisma.prediction.findMany({
    where: {
      profile: {
        brandId,
      },
    },
  });

  // Calculate ML impact score based on predictions quality
  const mlImpactScore = predictions.length > 0
    ? Math.min(100, (predictions.length / customerCount) * 100)
    : 0;

  // Features used (track from various tables)
  const featuresUsed: string[] = [];
  
  // Check if brand uses different features
  const hasAutomations = await prisma.marketingAutomation.count({
    where: { brandId },
  }) > 0;
  
  const hasCampaigns = await prisma.campaign.count({
    where: { brandId },
  }) > 0;
  
  const hasProductIntents = await prisma.productIntent.count({
    where: { brandId },
  }) > 0;

  if (hasAutomations) featuresUsed.push('automation');
  if (hasCampaigns) featuresUsed.push('campaigns');
  if (hasProductIntents) featuresUsed.push('product_intent');

  // API calls (placeholder - would need to track in a separate table)
  const apiCalls = 0; // TODO: Track API calls per brand

  // Usage score (0-100): based on features used and activity
  const usageScore = Math.min(100, (featuresUsed.length * 25) + (apiCalls > 0 ? 25 : 0));

  return {
    brandId,
    date: startOfDay,
    revenue: totalRevenue,
    revenueGrowth,
    customerCount,
    newCustomers,
    orderCount: totalOrders,
    orderValue: totalRevenue,
    avgOrderValue: avgOrderValue || undefined,
    engagementScore,
    activeCustomers,
    mlImpactScore,
    usageScore,
    apiCalls,
    featuresUsed,
  };
}

/**
 * Collect metrics for all active brands
 */
export async function collectAllBrandsMetrics(date: Date = new Date()): Promise<void> {
  const prisma = getPrismaClient();

  const activeBrands = await prisma.brand.findMany({
    where: {
      status: 'active',
    },
    select: {
      id: true,
    },
  });

  for (const brand of activeBrands) {
    try {
      await collectAndSaveBrandMetrics(brand.id, date);
    } catch (error) {
      console.error(`Failed to collect metrics for brand ${brand.id}:`, error);
    }
  }
}

/**
 * Collect and save metrics for a brand
 */
export async function collectAndSaveBrandMetrics(
  brandId: string,
  date: Date = new Date()
): Promise<void> {
  const prisma = getPrismaClient();
  const metrics = await collectBrandMetrics(brandId, date);

  // Get previous metrics for trend calculation
  const previousDate = new Date(date);
  previousDate.setDate(previousDate.getDate() - 1);
  
  const previousMetrics = await prisma.brandMetrics.findUnique({
    where: {
      brandId_date: {
        brandId,
        date: previousDate,
      },
    },
  });

  // Calculate performance score (will be done by calculator)
  // For now, save raw metrics
  await prisma.brandMetrics.upsert({
    where: {
      brandId_date: {
        brandId: metrics.brandId,
        date: metrics.date,
      },
    },
    create: {
      brandId: metrics.brandId,
      date: metrics.date,
      revenue: metrics.revenue,
      revenueGrowth: metrics.revenueGrowth,
      mrr: metrics.mrr,
      customerCount: metrics.customerCount,
      newCustomers: metrics.newCustomers,
      churnRate: metrics.churnRate,
      orderCount: metrics.orderCount,
      orderValue: metrics.orderValue,
      avgOrderValue: metrics.avgOrderValue,
      engagementScore: metrics.engagementScore,
      activeCustomers: metrics.activeCustomers,
      retentionRate: metrics.retentionRate,
      mlImpactScore: metrics.mlImpactScore,
      churnReduction: metrics.churnReduction,
      ltvIncrease: metrics.ltvIncrease,
      usageScore: metrics.usageScore,
      apiCalls: metrics.apiCalls,
      featuresUsed: metrics.featuresUsed,
    },
    update: {
      revenue: metrics.revenue,
      revenueGrowth: metrics.revenueGrowth,
      mrr: metrics.mrr,
      customerCount: metrics.customerCount,
      newCustomers: metrics.newCustomers,
      churnRate: metrics.churnRate,
      orderCount: metrics.orderCount,
      orderValue: metrics.orderValue,
      avgOrderValue: metrics.avgOrderValue,
      engagementScore: metrics.engagementScore,
      activeCustomers: metrics.activeCustomers,
      retentionRate: metrics.retentionRate,
      mlImpactScore: metrics.mlImpactScore,
      churnReduction: metrics.churnReduction,
      ltvIncrease: metrics.ltvIncrease,
      usageScore: metrics.usageScore,
      apiCalls: metrics.apiCalls,
      featuresUsed: metrics.featuresUsed,
    },
  });

  // Update performance score after saving metrics
  try {
    await updateBrandPerformanceScore(brandId, date);
  } catch (error) {
    console.error(`Failed to update performance score for brand ${brandId}:`, error);
  }
}

