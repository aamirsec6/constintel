// GENERATOR: AUTH_SYSTEM
// Performance score calculation service
// Calculates composite performance score (0-100) based on multiple KPIs

import { getPrismaClient } from '../../db/prismaClient';

export interface PerformanceScoreWeights {
  revenueGrowth: number;
  customerGrowth: number;
  engagement: number;
  mlImpact: number;
  usage: number;
}

const DEFAULT_WEIGHTS: PerformanceScoreWeights = {
  revenueGrowth: 0.30, // 30%
  customerGrowth: 0.25, // 25%
  engagement: 0.20, // 20%
  mlImpact: 0.15, // 15%
  usage: 0.10, // 10%
};

/**
 * Normalize a value to 0-100 scale
 */
function normalize(value: number, min: number, max: number): number {
  if (max === min) return 50; // Default to middle if no range
  const normalized = ((value - min) / (max - min)) * 100;
  return Math.max(0, Math.min(100, normalized));
}

/**
 * Calculate performance score for a brand
 */
export async function calculatePerformanceScore(
  brandId: string,
  date: Date = new Date(),
  weights: PerformanceScoreWeights = DEFAULT_WEIGHTS
): Promise<{
  score: number;
  breakdown: {
    revenueGrowth: number;
    customerGrowth: number;
    engagement: number;
    mlImpact: number;
    usage: number;
  };
  trend: 'up' | 'down' | 'stable';
}> {
  const prisma = getPrismaClient();

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  // Get current metrics
  const currentMetrics = await prisma.brandMetrics.findUnique({
    where: {
      brandId_date: {
        brandId,
        date: startOfDay,
      },
    },
  });

  if (!currentMetrics) {
    // If no metrics, return default score
    return {
      score: 0,
      breakdown: {
        revenueGrowth: 0,
        customerGrowth: 0,
        engagement: 0,
        mlImpact: 0,
        usage: 0,
      },
      trend: 'stable',
    };
  }

  // Get previous day for comparison
  const previousDate = new Date(startOfDay);
  previousDate.setDate(previousDate.getDate() - 1);

  const previousMetrics = await prisma.brandMetrics.findUnique({
    where: {
      brandId_date: {
        brandId,
        date: previousDate,
      },
    },
  });

  // Get platform averages for normalization
  const platformMetrics = await prisma.brandMetrics.findMany({
    where: {
      date: startOfDay,
    },
  });

  // Calculate component scores (0-100 each)

  // 1. Revenue Growth Score
  const revenueGrowthValue = currentMetrics.revenueGrowth || 0;
  const platformRevenueGrowths = platformMetrics
    .map(m => m.revenueGrowth)
    .filter((v): v is number => v !== null);
  const avgRevenueGrowth =
    platformRevenueGrowths.length > 0
      ? platformRevenueGrowths.reduce((a, b) => a + b, 0) / platformRevenueGrowths.length
      : 0;
  const revenueGrowthScore = normalize(
    revenueGrowthValue,
    Math.min(...platformRevenueGrowths, revenueGrowthValue),
    Math.max(...platformRevenueGrowths, revenueGrowthValue, 100)
  );

  // 2. Customer Growth Score
  const customerGrowth = previousMetrics
    ? ((currentMetrics.customerCount - previousMetrics.customerCount) /
        (previousMetrics.customerCount || 1)) *
      100
    : 0;
  const customerGrowthScore = normalize(customerGrowth, -10, 50);

  // 3. Engagement Score (already 0-100)
  const engagementScore = currentMetrics.engagementScore || 0;

  // 4. ML Impact Score (already 0-100)
  const mlImpactScore = currentMetrics.mlImpactScore || 0;

  // 5. Usage Score (already 0-100)
  const usageScore = currentMetrics.usageScore || 0;

  // Calculate weighted composite score
  const compositeScore =
    revenueGrowthScore * weights.revenueGrowth +
    customerGrowthScore * weights.customerGrowth +
    engagementScore * weights.engagement +
    mlImpactScore * weights.mlImpact +
    usageScore * weights.usage;

  // Determine trend
  const previousScore = previousMetrics?.performanceScore || 0;
  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (compositeScore > previousScore + 2) {
    trend = 'up';
  } else if (compositeScore < previousScore - 2) {
    trend = 'down';
  }

  return {
    score: Math.round(compositeScore * 100) / 100, // Round to 2 decimals
    breakdown: {
      revenueGrowth: Math.round(revenueGrowthScore * 100) / 100,
      customerGrowth: Math.round(customerGrowthScore * 100) / 100,
      engagement: Math.round(engagementScore * 100) / 100,
      mlImpact: Math.round(mlImpactScore * 100) / 100,
      usage: Math.round(usageScore * 100) / 100,
    },
    trend,
  };
}

/**
 * Update performance score for a brand
 */
export async function updateBrandPerformanceScore(
  brandId: string,
  date: Date = new Date()
): Promise<void> {
  const prisma = getPrismaClient();

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const { score, breakdown, trend } = await calculatePerformanceScore(brandId, date);

  // Get previous score
  const previousDate = new Date(startOfDay);
  previousDate.setDate(previousDate.getDate() - 1);
  
  const previousMetrics = await prisma.brandMetrics.findUnique({
    where: {
      brandId_date: {
        brandId,
        date: previousDate,
      },
    },
  });

  // Update metrics with performance score
  await prisma.brandMetrics.update({
    where: {
      brandId_date: {
        brandId,
        date: startOfDay,
      },
    },
    data: {
      performanceScore: score,
      previousScore: previousMetrics?.performanceScore || null,
      trend,
    },
  });
}

/**
 * Calculate and update performance scores for all brands
 */
export async function updateAllBrandsPerformanceScores(
  date: Date = new Date()
): Promise<void> {
  const prisma = getPrismaClient();

  const brands = await prisma.brand.findMany({
    where: {
      status: 'active',
    },
    select: {
      id: true,
    },
  });

  for (const brand of brands) {
    try {
      await updateBrandPerformanceScore(brand.id, date);
    } catch (error) {
      console.error(`Failed to update performance score for brand ${brand.id}:`, error);
    }
  }
}

