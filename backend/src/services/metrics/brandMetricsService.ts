// GENERATOR: AUTH_SYSTEM
// Brand metrics service
// Aggregates and provides brand metrics data for admin dashboard

import { getPrismaClient } from '../../db/prismaClient';

/**
 * Get metrics for a specific brand
 */
export async function getBrandMetrics(
  brandId: string,
  days: number = 30
) {
  const prisma = getPrismaClient();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const metrics = await prisma.brandMetrics.findMany({
    where: {
      brandId,
      date: {
        gte: startDate,
      },
    },
    orderBy: {
      date: 'asc',
    },
  });

  return metrics;
}

/**
 * Get latest metrics for all brands (for market view)
 */
export async function getAllBrandsLatestMetrics() {
  const prisma = getPrismaClient();

  // Get all active brands
  const brands = await prisma.brand.findMany({
    where: {
      status: {
        in: ['active', 'trial'],
      },
    },
    select: {
      id: true,
      name: true,
      domain: true,
      industry: true,
      plan: true,
      createdAt: true,
      lastActivityAt: true,
    },
  });

  // Get latest metrics for each brand
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const brandsWithMetrics = await Promise.all(
    brands.map(async (brand) => {
      const latestMetrics = await prisma.brandMetrics.findFirst({
        where: {
          brandId: brand.id,
        },
        orderBy: {
          date: 'desc',
        },
      });

      // Get historical metrics for trend
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const historicalMetrics = await prisma.brandMetrics.findMany({
        where: {
          brandId: brand.id,
          date: {
            gte: thirtyDaysAgo,
          },
        },
        select: {
          date: true,
          performanceScore: true,
          revenue: true,
          customerCount: true,
        },
        orderBy: {
          date: 'asc',
        },
      });

      return {
        ...brand,
        metrics: latestMetrics,
        historicalTrend: historicalMetrics.map(m => ({
          date: m.date,
          score: m.performanceScore || 0,
          revenue: Number(m.revenue),
          customers: m.customerCount,
        })),
      };
    })
  );

  return brandsWithMetrics.filter((b) => b.metrics !== null);
}

/**
 * Get platform average metrics
 */
export async function getPlatformAverageMetrics() {
  const prisma = getPrismaClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const allMetrics = await prisma.brandMetrics.findMany({
    where: {
      date: today,
    },
  });

  if (allMetrics.length === 0) {
    return null;
  }

  const averages = {
    performanceScore:
      allMetrics.reduce((sum, m) => sum + (m.performanceScore || 0), 0) /
      allMetrics.length,
    revenueGrowth:
      allMetrics
        .filter((m) => m.revenueGrowth !== null)
        .reduce((sum, m) => sum + (m.revenueGrowth || 0), 0) /
      allMetrics.filter((m) => m.revenueGrowth !== null).length,
    customerCount:
      allMetrics.reduce((sum, m) => sum + m.customerCount, 0) /
      allMetrics.length,
    engagementScore:
      allMetrics
        .filter((m) => m.engagementScore !== null)
        .reduce((sum, m) => sum + (m.engagementScore || 0), 0) /
      allMetrics.filter((m) => m.engagementScore !== null).length,
  };

  return averages;
}

