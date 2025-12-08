// GENERATOR: PLANOGRAM_INTELLIGENCE
// ASSUMPTIONS: Prisma client, product intent service, inventory service
// HOW TO RUN: import { getPlanogramInsights, calculatePlanogramScore, getCategoryTrends, getProductRecommendations } from './planogramService'
//
// TODO: Future Enhancements
// - Integrate camera-based heatmap data for real-time foot traffic analysis
// - Add real-time aisle footfall analytics with sensor/WiFi tracking integration
// - Implement ML model to predict optimal shelf placement based on historical performance data
// - Build A/B testing framework to measure effectiveness of planogram changes
// - Add support for multi-store planogram comparison and benchmarking

import { getPrismaClient } from '../../db/prismaClient';

const prisma = getPrismaClient();

export interface PlanogramOptions {
  storeId?: string;
  category?: string;
  limit?: number;
  offset?: number;
  priority?: 'high' | 'medium' | 'low';
}

export interface PlanogramInsights {
  summary: {
    topCategories: Array<{
      category: string;
      intentScore: number;
      salesCount: number;
      trend: 'up' | 'down' | 'stable';
    }>;
    underperformingCategories: Array<{
      category: string;
      intentScore: number;
      salesCount: number;
      gap: number;
    }>;
    risingInterest: Array<{
      productId: string;
      productName: string;
      trendDelta: number;
      intentScore: number;
    }>;
  };
  recommendations: Array<{
    productId: string;
    productName: string;
    category: string;
    onlineIntent: number;
    storeSales: number;
    intentScore: number;
    recommendation: string;
    priority: 'high' | 'medium' | 'low';
    planogramScore: number;
  }>;
  insights: {
    intentVsSales: Array<{
      productId: string;
      intentScore: number;
      salesCount: number;
      gap: number;
    }>;
    categoryHeatmap: Array<{
      category: string;
      intentScore: number;
      salesCount: number;
      visibilityScore: number;
    }>;
  };
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

/**
 * Extract product IDs from purchase event payloads
 */
function extractProductIdsFromEvents(events: any[]): Map<string, number> {
  const productSales = new Map<string, number>();
  
  events.forEach(event => {
    try {
      const payload = event.payload as any;
      const items = payload.items || [];
      
      items.forEach((item: any) => {
        const productId = item.product_id || item.productId || item.id;
        if (productId) {
          productSales.set(productId, (productSales.get(productId) || 0) + (item.quantity || 1));
        }
      });
    } catch (error) {
      // Skip malformed payloads
      console.warn('Error parsing purchase event payload:', error);
    }
  });
  
  return productSales;
}

/**
 * Calculate planogram score for a product
 * planogramScore = (onlineIntent * 0.6) + (offlineSales * 0.2) + (trendDelta * 0.2)
 * 
 * TODO: Enhance scoring algorithm with ML model predictions
 * - Integrate footfall data when available
 * - Add seasonal adjustment factors
 * - Include competitor analysis data
 */
export async function calculatePlanogramScore(
  productId: string,
  brandId: string,
  storeId?: string
): Promise<{
  planogramScore: number;
  onlineIntent: number;
  offlineSales: number;
  trendDelta: number;
}> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Get online intent scores
  const allIntents = await prisma.productIntent.findMany({
    where: {
      brandId,
      productId,
      status: 'active',
    },
  });

  // Calculate average intent score (normalized 0-100)
  const avgIntentScore = allIntents.length > 0
    ? allIntents.reduce((sum, intent) => sum + intent.intentScore, 0) / allIntents.length
    : 0;

  // Get 7-day and 30-day intent averages
  const intents7Day = allIntents.filter(i => i.lastSeenAt >= sevenDaysAgo);
  const intents30Day = allIntents.filter(i => i.lastSeenAt >= thirtyDaysAgo);

  const avgIntent7Day = intents7Day.length > 0
    ? intents7Day.reduce((sum, intent) => sum + intent.intentScore, 0) / intents7Day.length
    : 0;

  const avgIntent30Day = intents30Day.length > 0
    ? intents30Day.reduce((sum, intent) => sum + intent.intentScore, 0) / intents30Day.length
    : 0;

  const trendDelta = avgIntent7Day - avgIntent30Day;

  // Get offline sales count
  const purchaseEvents = await prisma.customerRawEvent.findMany({
    where: {
      brandId,
      eventType: { in: ['purchase', 'pos_transaction'] },
      createdAt: { gte: thirtyDaysAgo },
    },
  });

  const productSales = extractProductIdsFromEvents(purchaseEvents);
  const salesCount = productSales.get(productId) || 0;

  // Normalize sales count (0-100 scale, assuming max 100 sales = 100 score)
  const normalizedSales = Math.min(salesCount * 1, 100);

  // Normalize trend delta (0-100 scale, assuming max delta of 50 = 100 score)
  const normalizedTrendDelta = Math.max(0, Math.min((trendDelta + 50) * 2, 100));

  // Calculate planogram score
  const planogramScore = (avgIntentScore * 0.6) + (normalizedSales * 0.2) + (normalizedTrendDelta * 0.2);

  return {
    planogramScore: Math.round(planogramScore * 100) / 100,
    onlineIntent: Math.round(avgIntentScore * 100) / 100,
    offlineSales: salesCount,
    trendDelta: Math.round(trendDelta * 100) / 100,
  };
}

/**
 * Get category-level trends
 */
export async function getCategoryTrends(
  brandId: string,
  timeWindow: number = 30
): Promise<Array<{
  category: string;
  intentScore: number;
  salesCount: number;
  trend: 'up' | 'down' | 'stable';
  gap?: number;
}>> {
  const cutoffDate = new Date(Date.now() - timeWindow * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Get all product intents
  const intents = await prisma.productIntent.findMany({
    where: {
      brandId,
      status: 'active',
      lastSeenAt: { gte: cutoffDate },
    },
  });

  // Get purchase events
  const purchaseEvents = await prisma.customerRawEvent.findMany({
    where: {
      brandId,
      eventType: { in: ['purchase', 'pos_transaction'] },
      createdAt: { gte: cutoffDate },
    },
  });

  const productSales = extractProductIdsFromEvents(purchaseEvents);

  // Aggregate by category
  const categoryStats: Record<string, {
    intentScores: number[];
    salesCount: number;
    intentScores7Day: number[];
  }> = {};

  intents.forEach(intent => {
    const category = intent.category || 'uncategorized';
    if (!categoryStats[category]) {
      categoryStats[category] = {
        intentScores: [],
        salesCount: 0,
        intentScores7Day: [],
      };
    }
    categoryStats[category].intentScores.push(intent.intentScore);
    if (intent.lastSeenAt >= sevenDaysAgo) {
      categoryStats[category].intentScores7Day.push(intent.intentScore);
    }
  });

  // Add sales counts
  const productIds = new Set(intents.map(i => i.productId));
  productIds.forEach(productId => {
    const sales = productSales.get(productId) || 0;
    const productIntent = intents.find(i => i.productId === productId);
    if (productIntent) {
      const category = productIntent.category || 'uncategorized';
      if (categoryStats[category]) {
        categoryStats[category].salesCount += sales;
      }
    }
  });

  // Calculate trends and gaps
  const trends = Object.entries(categoryStats).map(([category, stats]) => {
    const avgIntent = stats.intentScores.length > 0
      ? stats.intentScores.reduce((sum, score) => sum + score, 0) / stats.intentScores.length
      : 0;

    const avgIntent7Day = stats.intentScores7Day.length > 0
      ? stats.intentScores7Day.reduce((sum, score) => sum + score, 0) / stats.intentScores7Day.length
      : 0;

    const avgIntent30Day = avgIntent;

    const trendDelta = avgIntent7Day - avgIntent30Day;
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (trendDelta > 5) trend = 'up';
    else if (trendDelta < -5) trend = 'down';

    // Calculate gap (difference between intent and sales)
    const normalizedSales = Math.min(stats.salesCount * 1, 100);
    const gap = avgIntent - normalizedSales;

    return {
      category,
      intentScore: Math.round(avgIntent * 100) / 100,
      salesCount: stats.salesCount,
      trend,
      gap: Math.round(gap * 100) / 100,
    };
  });

  return trends.sort((a, b) => b.intentScore - a.intentScore);
}

/**
 * Generate product recommendations with priority levels
 */
export async function getProductRecommendations(
  brandId: string,
  storeId?: string,
  limit: number = 50
): Promise<Array<{
  productId: string;
  productName: string;
  category: string;
  onlineIntent: number;
  storeSales: number;
  intentScore: number;
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
  planogramScore: number;
}>> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Get all active product intents
  const intents = await prisma.productIntent.findMany({
    where: {
      brandId,
      status: 'active',
      lastSeenAt: { gte: thirtyDaysAgo },
    },
    include: {
      profile: {
        select: {
          id: true,
        },
      },
    },
  });

  // Get purchase events
  const purchaseEvents = await prisma.customerRawEvent.findMany({
    where: {
      brandId,
      eventType: { in: ['purchase', 'pos_transaction'] },
      createdAt: { gte: thirtyDaysAgo },
    },
  });

  const productSales = extractProductIdsFromEvents(purchaseEvents);

  // Get products metadata
  const productIds = Array.from(new Set(intents.map(i => i.productId)));
  const products = await prisma.product.findMany({
    where: {
      brandId,
      productId: { in: productIds },
    },
  });

  const productMap = new Map(products.map(p => [p.productId, p]));

  // Aggregate by product
  const productStats: Record<string, {
    productId: string;
    productName: string;
    category: string;
    intentScores: number[];
    salesCount: number;
    lastSeenAt: Date;
  }> = {};

  intents.forEach(intent => {
    const productId = intent.productId;
    if (!productStats[productId]) {
      const product = productMap.get(productId);
      productStats[productId] = {
        productId,
        productName: intent.productName || product?.name || productId,
        category: intent.category || product?.category || 'uncategorized',
        intentScores: [],
        salesCount: 0,
        lastSeenAt: intent.lastSeenAt,
      };
    }
    productStats[productId].intentScores.push(intent.intentScore);
    if (intent.lastSeenAt > productStats[productId].lastSeenAt) {
      productStats[productId].lastSeenAt = intent.lastSeenAt;
    }
  });

  // Add sales counts
  productSales.forEach((count, productId) => {
    if (productStats[productId]) {
      productStats[productId].salesCount = count;
    }
  });

  // Calculate scores and generate recommendations
  const recommendations = await Promise.all(
    Object.values(productStats).map(async (stats) => {
      const avgIntentScore = stats.intentScores.length > 0
        ? stats.intentScores.reduce((sum, score) => sum + score, 0) / stats.intentScores.length
        : 0;

      const scoreData = await calculatePlanogramScore(stats.productId, brandId, storeId);

      // Generate recommendation based on patterns
      // TODO: Replace rule-based recommendations with ML model predictions
      // - Train model on historical planogram changes and their impact on sales
      // - Include footfall data, customer path analysis, and conversion rates
      let recommendation = '';
      let priority: 'high' | 'medium' | 'low' = 'low';

      if (avgIntentScore >= 70 && stats.salesCount < 5) {
        recommendation = 'Move to eye-level shelf. Online intent is high but conversion is low. Better visibility needed.';
        priority = 'high';
      } else if (scoreData.trendDelta > 20) {
        recommendation = 'Move to promotional shelf. Rising interest detected.';
        priority = 'high';
      } else if (avgIntentScore >= 50 && stats.salesCount < 10) {
        recommendation = 'Consider moving to more visible location. Moderate intent with low sales.';
        priority = 'medium';
      } else if (stats.salesCount >= 20 && avgIntentScore < 30) {
        recommendation = 'Keep current placement. High sales despite low online intent.';
        priority = 'low';
      } else if (avgIntentScore >= 40) {
        recommendation = 'Monitor performance. Moderate intent and sales.';
        priority = 'medium';
      } else {
        recommendation = 'Current placement appears adequate.';
        priority = 'low';
      }

      return {
        productId: stats.productId,
        productName: stats.productName,
        category: stats.category,
        onlineIntent: Math.round(avgIntentScore * 100) / 100,
        storeSales: stats.salesCount,
        intentScore: Math.round(avgIntentScore * 100) / 100,
        recommendation,
        priority,
        planogramScore: scoreData.planogramScore,
      };
    })
  );

  // Sort by planogram score and priority
  recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    return b.planogramScore - a.planogramScore;
  });

  return recommendations.slice(0, limit);
}

/**
 * Get comprehensive planogram insights
 */
export async function getPlanogramInsights(
  brandId: string,
  options: PlanogramOptions = {}
): Promise<PlanogramInsights> {
  const {
    storeId,
    category,
    limit = 50,
    offset = 0,
    priority,
  } = options;

  // Get category trends
  const categoryTrends = await getCategoryTrends(brandId, 30);

  // Get top categories (by intent score)
  const topCategories = categoryTrends
    .sort((a, b) => b.intentScore - a.intentScore)
    .slice(0, 5)
    .map(trend => ({
      category: trend.category,
      intentScore: trend.intentScore,
      salesCount: trend.salesCount,
      trend: trend.trend,
    }));

  // Get underperforming categories (high intent, low sales)
  const underperformingCategories = categoryTrends
    .filter(trend => trend.gap && trend.gap > 20)
    .sort((a, b) => (b.gap || 0) - (a.gap || 0))
    .slice(0, 5)
    .map(trend => ({
      category: trend.category,
      intentScore: trend.intentScore,
      salesCount: trend.salesCount,
      gap: trend.gap || 0,
    }));

  // Get rising interest items
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const intents7Day = await prisma.productIntent.findMany({
    where: {
      brandId,
      status: 'active',
      lastSeenAt: { gte: sevenDaysAgo },
    },
  });

  const intents30Day = await prisma.productIntent.findMany({
    where: {
      brandId,
      status: 'active',
      lastSeenAt: { gte: thirtyDaysAgo },
    },
  });

  const productTrends: Record<string, {
    productId: string;
    productName: string;
    intent7Day: number[];
    intent30Day: number[];
  }> = {};

  intents7Day.forEach(intent => {
    if (!productTrends[intent.productId]) {
      productTrends[intent.productId] = {
        productId: intent.productId,
        productName: intent.productName || intent.productId,
        intent7Day: [],
        intent30Day: [],
      };
    }
    productTrends[intent.productId].intent7Day.push(intent.intentScore);
  });

  intents30Day.forEach(intent => {
    if (productTrends[intent.productId]) {
      productTrends[intent.productId].intent30Day.push(intent.intentScore);
    }
  });

  const risingInterest = Object.values(productTrends)
    .map(trend => {
      const avg7Day = trend.intent7Day.length > 0
        ? trend.intent7Day.reduce((sum, score) => sum + score, 0) / trend.intent7Day.length
        : 0;
      const avg30Day = trend.intent30Day.length > 0
        ? trend.intent30Day.reduce((sum, score) => sum + score, 0) / trend.intent30Day.length
        : 0;
      return {
        productId: trend.productId,
        productName: trend.productName,
        trendDelta: Math.round((avg7Day - avg30Day) * 100) / 100,
        intentScore: Math.round(avg7Day * 100) / 100,
      };
    })
    .filter(item => item.trendDelta > 10)
    .sort((a, b) => b.trendDelta - a.trendDelta)
    .slice(0, 10);

  // Get product recommendations
  let recommendations = await getProductRecommendations(brandId, storeId, limit * 2);

  // Apply filters
  if (category) {
    recommendations = recommendations.filter(r => r.category === category);
  }

  if (priority) {
    recommendations = recommendations.filter(r => r.priority === priority);
  }

  // Apply pagination
  const total = recommendations.length;
  const paginatedRecommendations = recommendations.slice(offset, offset + limit);

  // Get intent vs sales insights
  const intentVsSales = paginatedRecommendations.map(rec => ({
    productId: rec.productId,
    intentScore: rec.intentScore,
    salesCount: rec.storeSales,
    gap: Math.round((rec.intentScore - Math.min(rec.storeSales * 1, 100)) * 100) / 100,
  }));

  // Get category heatmap data
  const categoryHeatmap = categoryTrends.map(trend => ({
    category: trend.category,
    intentScore: trend.intentScore,
    salesCount: trend.salesCount,
    visibilityScore: Math.round((trend.intentScore * 0.6 + Math.min(trend.salesCount * 1, 100) * 0.4) * 100) / 100,
  }));

  return {
    summary: {
      topCategories,
      underperformingCategories,
      risingInterest,
    },
    recommendations: paginatedRecommendations,
    insights: {
      intentVsSales,
      categoryHeatmap,
    },
    pagination: {
      total,
      limit,
      offset,
    },
  };
}

