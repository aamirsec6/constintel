// GENERATOR: OMNICHANNEL_PLATFORM
// ASSUMPTIONS: Prisma client, product intent service
// HOW TO RUN: import { getTrendingProducts, getDemandSignals, getStoreRecommendations } from './inventoryService'

import { getPrismaClient } from '../../db/prismaClient';

const prisma = getPrismaClient();

/**
 * Get trending products based on customer interest
 */
export async function getTrendingProducts(
  brandId: string,
  options?: {
    limit?: number;
    timeWindow?: number; // days
    minIntentScore?: number;
  }
): Promise<any[]> {
  const { limit = 20, timeWindow = 7, minIntentScore = 30 } = options || {};

  const cutoffDate = new Date(Date.now() - timeWindow * 24 * 60 * 60 * 1000);

  // Get product intents from last N days
  const intents = await prisma.productIntent.findMany({
    where: {
      brandId,
      status: 'active',
      intentScore: { gte: minIntentScore },
      lastSeenAt: { gte: cutoffDate },
    },
  });

  // Aggregate by product
  const productStats: Record<string, {
    productId: string;
    productName: string;
    category: string;
    totalIntents: number;
    avgIntentScore: number;
    uniqueCustomers: number;
    lastSeenAt: Date;
  }> = {};

  intents.forEach(intent => {
    if (!productStats[intent.productId]) {
      productStats[intent.productId] = {
        productId: intent.productId,
        productName: intent.productName || intent.productId,
        category: intent.category || 'unknown',
        totalIntents: 0,
        avgIntentScore: 0,
        uniqueCustomers: 0,
        lastSeenAt: intent.lastSeenAt,
      };
    }

    productStats[intent.productId].totalIntents++;
    productStats[intent.productId].avgIntentScore += intent.intentScore;
    productStats[intent.productId].uniqueCustomers++;
    
    if (intent.lastSeenAt > productStats[intent.productId].lastSeenAt) {
      productStats[intent.productId].lastSeenAt = intent.lastSeenAt;
    }
  });

  // Calculate averages and sort by trending score
  const trending = Object.values(productStats)
    .map(stat => ({
      ...stat,
      avgIntentScore: stat.avgIntentScore / stat.totalIntents,
      trendingScore: stat.totalIntents * 0.5 + stat.avgIntentScore * 0.3 + stat.uniqueCustomers * 0.2,
    }))
    .sort((a, b) => b.trendingScore - a.trendingScore)
    .slice(0, limit);

  return trending;
}

/**
 * Get demand signals by product
 */
export async function getDemandSignals(
  brandId: string,
  productId?: string
): Promise<any[]> {
  const where: any = {
    brandId,
    status: 'active',
    intentScore: { gte: 50 }, // High intent only
  };

  if (productId) {
    where.productId = productId;
  }

  // Get high-intent products
  const intents = await prisma.productIntent.findMany({
    where,
    include: {
      profile: {
        select: {
          id: true,
          lifetimeValue: true,
          totalOrders: true,
        },
      },
    },
  });

  // Aggregate by product
  const demandSignals: Record<string, {
    productId: string;
    productName: string;
    category: string;
    highIntentCustomers: number;
    totalIntentScore: number;
    avgCustomerLTV: number;
    storesWithInterest: Set<string>;
  }> = {};

  intents.forEach(intent => {
    if (!demandSignals[intent.productId]) {
      demandSignals[intent.productId] = {
        productId: intent.productId,
        productName: intent.productName || intent.productId,
        category: intent.category || 'unknown',
        highIntentCustomers: 0,
        totalIntentScore: 0,
        avgCustomerLTV: 0,
        storesWithInterest: new Set(),
      };
    }

    demandSignals[intent.productId].highIntentCustomers++;
    demandSignals[intent.productId].totalIntentScore += intent.intentScore;
    
    // Get store visits for this customer to see which stores they visit
    // This is simplified - in production, you'd query store visits
  });

  // Calculate averages
  const signals = Object.values(demandSignals).map(signal => {
    const avgIntentScore = signal.highIntentCustomers > 0 
      ? signal.totalIntentScore / signal.highIntentCustomers 
      : 0;
    return {
      productId: signal.productId,
      productName: signal.productName,
      category: signal.category,
      highIntentCustomers: signal.highIntentCustomers,
      avgIntentScore,
      demandScore: signal.highIntentCustomers * avgIntentScore,
      storesWithInterest: Array.from(signal.storesWithInterest),
    };
  });

  return signals.sort((a, b) => b.demandScore - a.demandScore);
}

/**
 * Get store-level inventory recommendations
 */
export async function getStoreRecommendations(
  brandId: string,
  storeId: string
): Promise<any> {
  // Get high-intent products for customers who visit this store
  const storeVisits = await prisma.storeVisit.findMany({
    where: {
      brandId,
      storeId,
      checkInAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      },
    },
    include: {
      profile: {
        select: { id: true },
      },
    },
  });

  const profileIds = storeVisits.map(v => v.profileId).filter(Boolean) as string[];

  if (profileIds.length === 0) {
    return {
      recommendedProducts: [],
      currentInventory: [],
      reorderSuggestions: [],
    };
  }

  // Get product intents for these customers
  const intents = await prisma.productIntent.findMany({
    where: {
      brandId,
      profileId: { in: profileIds },
      status: 'active',
      intentScore: { gte: 50 },
    },
  });

  // Aggregate by product
  const productDemand: Record<string, {
    productId: string;
    productName: string;
    category: string;
    demandCount: number;
    avgIntentScore: number;
  }> = {};

  intents.forEach(intent => {
    if (!productDemand[intent.productId]) {
      productDemand[intent.productId] = {
        productId: intent.productId,
        productName: intent.productName || intent.productId,
        category: intent.category || 'unknown',
        demandCount: 0,
        avgIntentScore: 0,
      };
    }

    productDemand[intent.productId].demandCount++;
    productDemand[intent.productId].avgIntentScore += intent.intentScore;
  });

  // Calculate averages
  const recommendations = Object.values(productDemand)
    .map(p => ({
      ...p,
      avgIntentScore: p.avgIntentScore / p.demandCount,
      priority: p.demandCount * p.avgIntentScore,
    }))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 10);

  // Get current inventory for this store
  const currentInventory = await prisma.inventory.findMany({
    where: {
      brandId,
      storeId,
    },
    include: {
      product: {
        select: {
          productId: true,
          name: true,
          category: true,
        },
      },
    },
  });

  // Identify reorder suggestions (low stock + high demand)
  const reorderSuggestions = recommendations
    .filter(rec => {
      const inventory = currentInventory.find(inv => inv.productId === rec.productId);
      if (!inventory) return true; // Not in inventory, should add
      return inventory.quantity <= (inventory.reorderPoint || 10); // Low stock
    })
    .map(rec => ({
      productId: rec.productId,
      productName: rec.productName,
      category: rec.category,
      reason: 'High customer demand + low stock',
      priority: rec.priority,
    }));

  return {
    recommendedProducts: recommendations,
    currentInventory: currentInventory.map(inv => ({
      productId: inv.productId,
      productName: inv.product?.name || inv.productId,
      quantity: inv.quantity,
      reorderPoint: inv.reorderPoint,
      demandScore: inv.demandScore,
    })),
    reorderSuggestions,
  };
}

/**
 * Get product insights
 */
export async function getProductInsights(
  brandId: string,
  productId: string
): Promise<any> {
  // Get all intents for this product
  const intents = await prisma.productIntent.findMany({
    where: {
      brandId,
      productId,
      status: 'active',
    },
    include: {
      profile: {
        select: {
          id: true,
          lifetimeValue: true,
          totalOrders: true,
        },
      },
    },
  });

  // Get purchase events for this product
  const purchaseEvents = await prisma.customerRawEvent.findMany({
    where: {
      brandId,
      eventType: { in: ['purchase', 'pos_transaction'] },
      payload: {
        path: ['items'],
        array_contains: [{ product_id: productId }],
      },
    },
  });

  // Calculate metrics
  const totalIntents = intents.length;
  const highIntentCount = intents.filter(i => i.intentScore >= 50).length;
  const avgIntentScore = intents.length > 0
    ? intents.reduce((sum, i) => sum + i.intentScore, 0) / intents.length
    : 0;
  const conversionRate = totalIntents > 0
    ? (purchaseEvents.length / totalIntents) * 100
    : 0;

  // Get customer segments interested in this product
  const customerSegments: Record<string, number> = {};
  intents.forEach(intent => {
    // This would require joining with predictions - simplified for now
  });

  // Get store-level demand
  const storeDemand: Record<string, number> = {};
  intents.forEach(intent => {
    // Get store visits for this customer
    // Simplified - in production, query store visits
  });

  return {
    productId,
    totalIntents,
    highIntentCount,
    avgIntentScore,
    totalPurchases: purchaseEvents.length,
    conversionRate,
    customerSegments,
    storeDemand,
  };
}

