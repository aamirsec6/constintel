// GENERATOR: ANALYTICS_DASHBOARD
// Prediction analytics service for ML prediction trends and accuracy tracking
// HOW TO USE: import { getPredictionAnalytics, getModelPerformance } from './predictionAnalyticsService'

import { getPrismaClient } from '../../db/prismaClient';
import { getRedisClient } from '../redis/redisClient';

const prisma = getPrismaClient();

export interface PredictionTrend {
  date: string;
  atRiskCount: number; // Customers with churn score > 0.7
  avgChurnScore: number;
  avgPredictedLTV: number;
  segmentDistribution: {
    [segment: string]: number;
  };
}

export interface ModelPerformance {
  modelType: 'churn' | 'ltv' | 'segmentation';
  version: string;
  metrics: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
    rocAuc?: number;
    rmse?: number;
    mae?: number;
    r2?: number;
    mape?: number;
    silhouetteScore?: number;
  };
  trainingDate: Date;
  isActive: boolean;
}

export interface PredictionAnalyticsResult {
  trends: PredictionTrend[];
  modelPerformance: ModelPerformance[];
  accuracyTracking: {
    date: string;
    churnAccuracy: number;
    ltvAccuracy: number;
  }[];
  summary: {
    totalPredictions: number;
    atRiskCustomers: number;
    averageChurnScore: number;
    averagePredictedLTV: number;
    segmentDistribution: {
      [segment: string]: number;
    };
  };
}

const CACHE_PREFIX = 'analytics:prediction:';
const CACHE_TTL = 600; // 10 minutes

/**
 * Get cache key for prediction analytics
 */
function getCacheKey(brandId: string, startDate: Date, endDate: Date): string {
  return `${CACHE_PREFIX}${brandId}:${startDate.toISOString()}:${endDate.toISOString()}`;
}

/**
 * Format date for grouping
 */
function formatDate(date: Date, granularity: 'day' | 'week' | 'month' = 'day'): string {
  const d = new Date(date);
  switch (granularity) {
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
 * Get prediction trends over time
 */
async function getPredictionTrends(
  brandId: string,
  startDate: Date,
  endDate: Date
): Promise<PredictionTrend[]> {
  // Get all predictions with updated timestamps
  const profiles = await prisma.customerProfile.findMany({
    where: {
      brandId,
      predictions: {
        isNot: null,
      },
    },
    include: {
      predictions: {
        select: {
          churnScore: true,
          ltvScore: true,
          segment: true,
          updatedAt: true,
        },
      },
    },
  });

  // Group by date (day granularity)
  const trendsMap = new Map<string, {
    atRiskCount: number;
    churnScores: number[];
    ltvScores: number[];
    segments: Map<string, number>;
  }>();

  for (const profile of profiles) {
    if (!profile.predictions) continue;

    const date = formatDate(profile.predictions.updatedAt, 'day');
    
    if (!trendsMap.has(date)) {
      trendsMap.set(date, {
        atRiskCount: 0,
        churnScores: [],
        ltvScores: [],
        segments: new Map(),
      });
    }

    const trend = trendsMap.get(date)!;

    // Count at-risk customers (churn score > 0.7)
    if (profile.predictions.churnScore && profile.predictions.churnScore > 0.7) {
      trend.atRiskCount++;
    }

    // Collect scores
    if (profile.predictions.churnScore !== null && profile.predictions.churnScore !== undefined) {
      trend.churnScores.push(profile.predictions.churnScore);
    }

    if (profile.predictions.ltvScore !== null && profile.predictions.ltvScore !== undefined) {
      trend.ltvScores.push(profile.predictions.ltvScore);
    }

    // Count segments
    if (profile.predictions.segment) {
      const segment = profile.predictions.segment;
      trend.segments.set(segment, (trend.segments.get(segment) || 0) + 1);
    }
  }

  // Convert to array format
  const trends: PredictionTrend[] = [];

  for (const [date, data] of trendsMap.entries()) {
    const avgChurnScore = data.churnScores.length > 0
      ? data.churnScores.reduce((a, b) => a + b, 0) / data.churnScores.length
      : 0;

    const avgPredictedLTV = data.ltvScores.length > 0
      ? data.ltvScores.reduce((a, b) => a + b, 0) / data.ltvScores.length
      : 0;

    const segmentDistribution: { [segment: string]: number } = {};
    for (const [segment, count] of data.segments.entries()) {
      segmentDistribution[segment] = count;
    }

    trends.push({
      date,
      atRiskCount: data.atRiskCount,
      avgChurnScore: Math.round(avgChurnScore * 10000) / 10000,
      avgPredictedLTV: Math.round(avgPredictedLTV * 100) / 100,
      segmentDistribution,
    });
  }

  return trends.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Get model performance from model_version table
 */
async function getModelPerformance(): Promise<ModelPerformance[]> {
  const modelVersions = await prisma.modelVersion.findMany({
    where: {
      isActive: true,
    },
    select: {
      modelType: true,
      version: true,
      metrics: true,
      trainingDate: true,
      isActive: true,
    },
    orderBy: {
      trainingDate: 'desc',
    },
  });

  return modelVersions.map(mv => {
    const metrics = mv.metrics as any;
    
    return {
      modelType: mv.modelType as 'churn' | 'ltv' | 'segmentation',
      version: mv.version,
      metrics: {
        accuracy: metrics.accuracy,
        precision: metrics.precision,
        recall: metrics.recall,
        f1Score: metrics.f1_score || metrics.f1Score,
        rocAuc: metrics.roc_auc || metrics.rocAuc,
        rmse: metrics.rmse,
        mae: metrics.mae,
        r2: metrics.r2_score || metrics.r2,
        mape: metrics.mape,
        silhouetteScore: metrics.silhouette_score || metrics.silhouetteScore,
      },
      trainingDate: mv.trainingDate,
      isActive: mv.isActive,
    };
  });
}

/**
 * Get prediction analytics
 */
export async function getPredictionAnalytics(
  brandId: string,
  startDate: Date,
  endDate: Date,
  useCache: boolean = true
): Promise<PredictionAnalyticsResult> {
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

  // Get prediction trends
  const trends = await getPredictionTrends(brandId, startDate, endDate);

  // Get model performance
  const modelPerformance = await getModelPerformance();

  // Calculate summary from current predictions
  const profiles = await prisma.customerProfile.findMany({
    where: {
      brandId,
      predictions: {
        isNot: null,
      },
    },
    include: {
      predictions: {
        select: {
          churnScore: true,
          ltvScore: true,
          segment: true,
        },
      },
    },
  });

  let atRiskCount = 0;
  const churnScores: number[] = [];
  const ltvScores: number[] = [];
  const segmentCounts = new Map<string, number>();

  for (const profile of profiles) {
    if (!profile.predictions) continue;

    if (profile.predictions.churnScore && profile.predictions.churnScore > 0.7) {
      atRiskCount++;
    }

    if (profile.predictions.churnScore !== null && profile.predictions.churnScore !== undefined) {
      churnScores.push(profile.predictions.churnScore);
    }

    if (profile.predictions.ltvScore !== null && profile.predictions.ltvScore !== undefined) {
      ltvScores.push(profile.predictions.ltvScore);
    }

    if (profile.predictions.segment) {
      const segment = profile.predictions.segment;
      segmentCounts.set(segment, (segmentCounts.get(segment) || 0) + 1);
    }
  }

  const segmentDistribution: { [segment: string]: number } = {};
  for (const [segment, count] of segmentCounts.entries()) {
    segmentDistribution[segment] = count;
  }

  const averageChurnScore = churnScores.length > 0
    ? churnScores.reduce((a, b) => a + b, 0) / churnScores.length
    : 0;

  const averagePredictedLTV = ltvScores.length > 0
    ? ltvScores.reduce((a, b) => a + b, 0) / ltvScores.length
    : 0;

  // Simplified accuracy tracking (would need actual vs predicted data)
  const accuracyTracking: PredictionAnalyticsResult['accuracyTracking'] = [];

  const result: PredictionAnalyticsResult = {
    trends,
    modelPerformance,
    accuracyTracking,
    summary: {
      totalPredictions: profiles.length,
      atRiskCustomers: atRiskCount,
      averageChurnScore: Math.round(averageChurnScore * 10000) / 10000,
      averagePredictedLTV: Math.round(averagePredictedLTV * 100) / 100,
      segmentDistribution,
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
