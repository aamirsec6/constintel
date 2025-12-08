// GENERATOR: AUTH_SYSTEM
// Market data service for stock market-style visualization
// Provides real-time brand performance data in market format

import { getAllBrandsLatestMetrics, getPlatformAverageMetrics } from './brandMetricsService';

export interface MarketBrandData {
  id: string;
  name: string;
  symbol: string; // Short symbol for display
  score: number;
  change: number; // Percentage change
  changeType: 'up' | 'down' | 'stable';
  trend: 'up' | 'down' | 'stable';
  volume: number; // Customer count or revenue
  sparkline: Array<{ date: string; value: number }>;
  industry?: string;
}

/**
 * Get market data for all brands (stock market format)
 */
export async function getMarketData(): Promise<{
  brands: MarketBrandData[];
  platformAverage: {
    score: number;
    change: number;
  };
}> {
  const brandsData = await getAllBrandsLatestMetrics();
  const platformAvg = await getPlatformAverageMetrics();

  // Get previous day average for comparison
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const { getPrismaClient } = await import('../../db/prismaClient');
  const prisma = getPrismaClient();

  const yesterdayMetrics = await prisma.brandMetrics.findMany({
    where: {
      date: yesterday,
    },
  });

  const yesterdayAvg =
    yesterdayMetrics.length > 0
      ? yesterdayMetrics.reduce(
          (sum, m) => sum + (m.performanceScore || 0),
          0
        ) / yesterdayMetrics.length
      : 0;

  const platformAverageChange =
    platformAvg && yesterdayAvg > 0
      ? ((platformAvg.performanceScore - yesterdayAvg) / yesterdayAvg) * 100
      : 0;

  const brands: MarketBrandData[] = brandsData.map((brandData) => {
    const metrics = brandData.metrics!;
    const previousScore = metrics.previousScore || 0;
    const currentScore = metrics.performanceScore || 0;

    // Calculate percentage change
    const change =
      previousScore > 0 ? ((currentScore - previousScore) / previousScore) * 100 : 0;

    // Generate symbol (first 3-4 letters of brand name)
    const symbol = brandData.name
      .toUpperCase()
      .replace(/[^A-Z]/g, '')
      .slice(0, 4)
      .padEnd(4, 'X');

    // Generate sparkline data (last 30 days)
    const sparkline = brandData.historicalTrend
      .slice(-30)
      .map((point) => ({
        date: point.date.toISOString().split('T')[0],
        value: point.score,
      }));

    return {
      id: brandData.id,
      name: brandData.name,
      symbol,
      score: currentScore,
      change: Math.round(change * 100) / 100,
      changeType:
        change > 1 ? 'up' : change < -1 ? 'down' : 'stable',
      trend: (metrics.trend as 'up' | 'down' | 'stable') || 'stable',
      volume: metrics.customerCount,
      sparkline,
      industry: brandData.industry || undefined,
    };
  });

  // Sort by score (descending)
  brands.sort((a, b) => b.score - a.score);

  return {
    brands,
    platformAverage: {
      score: platformAvg?.performanceScore || 0,
      change: Math.round(platformAverageChange * 100) / 100,
    },
  };
}

/**
 * Get market data for a specific brand
 */
export async function getBrandMarketData(brandId: string): Promise<MarketBrandData | null> {
  const { getBrandMetrics } = await import('./brandMetricsService');
  const { getPrismaClient } = await import('../../db/prismaClient');
  const prisma = getPrismaClient();

  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
    select: {
      id: true,
      name: true,
      industry: true,
    },
  });

  if (!brand) {
    return null;
  }

  const metrics = await getBrandMetrics(brandId, 30);
  if (metrics.length === 0) {
    return null;
  }

  const latest = metrics[metrics.length - 1];
  const previous = metrics.length > 1 ? metrics[metrics.length - 2] : null;

  const previousScore = previous?.performanceScore || 0;
  const currentScore = latest.performanceScore || 0;
  const change =
    previousScore > 0 ? ((currentScore - previousScore) / previousScore) * 100 : 0;

  const symbol = brand.name
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 4)
    .padEnd(4, 'X');

  const sparkline = metrics.map((m) => ({
    date: m.date.toISOString().split('T')[0],
    value: m.performanceScore || 0,
  }));

  return {
    id: brand.id,
    name: brand.name,
    symbol,
    score: currentScore,
    change: Math.round(change * 100) / 100,
    changeType: change > 1 ? 'up' : change < -1 ? 'down' : 'stable',
    trend: (latest.trend as 'up' | 'down' | 'stable') || 'stable',
    volume: latest.customerCount,
    sparkline,
    industry: brand.industry || undefined,
  };
}

