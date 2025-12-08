// GENERATOR: OMNICHANNEL_PLATFORM
// ASSUMPTIONS: Prisma client, product intent calculator
// HOW TO RUN: import { trackProductIntent, getActiveIntents } from './productIntentService'

import { getPrismaClient } from '../../db/prismaClient';
import { calculateIntentScore, calculateExpirationDate, shouldExpireIntent, IntentContext } from './productIntentCalculator';

const prisma = getPrismaClient();

export interface TrackIntentParams {
  brandId: string;
  profileId: string;
  productId: string;
  productName?: string;
  category?: string;
  intentType: string; // "product_view", "product_search", "cart_add", "wishlist_add"
  sourceChannel?: string; // "web", "mobile_app", "whatsapp"
  sessionId?: string;
  pageUrl?: string;
  searchQuery?: string;
  viewDuration?: number; // seconds
}

export interface IntentResult {
  intentId: string;
  intentScore: number;
  isNew: boolean;
  wasUpdated: boolean;
}

/**
 * Track or update product intent for a customer
 * Creates new intent or updates existing one with higher score
 */
export async function trackProductIntent(params: TrackIntentParams): Promise<IntentResult> {
  const {
    brandId,
    profileId,
    productId,
    productName,
    category,
    intentType,
    sourceChannel = 'web',
    sessionId,
    pageUrl,
    searchQuery,
    viewDuration,
  } = params;

  // Find existing active intent for this product
  const existingIntent = await prisma.productIntent.findFirst({
    where: {
      brandId,
      profileId,
      productId,
      status: 'active',
    },
    orderBy: {
      lastSeenAt: 'desc',
    },
  });

  // Calculate hours since last view
  const hoursSinceLastView = existingIntent
    ? (Date.now() - existingIntent.lastSeenAt.getTime()) / (1000 * 60 * 60)
    : undefined;

  // Check if viewed multiple times
  const viewedMultipleTimes = existingIntent !== null;

  // Calculate session count (how many times viewed across sessions)
  const sessionCount = existingIntent
    ? (existingIntent.sessionId === sessionId ? 1 : 2) // Simplified - in production, count unique sessions
    : 1;

  // Build context for score calculation
  const context: IntentContext = {
    intentType,
    viewDuration,
    searched: intentType === 'product_search' || !!searchQuery,
    addedToCart: intentType === 'cart_add',
    viewedMultipleTimes,
    hoursSinceLastView,
    sessionCount,
  };

  const intentScore = calculateIntentScore(context);
  const expiresAt = calculateExpirationDate(30); // Default 30 days

  let intentId: string;
  let isNew = false;
  let wasUpdated = false;

  if (existingIntent) {
    // Update existing intent if new score is higher or if it's a stronger signal
    const shouldUpdate = intentScore > existingIntent.intentScore || 
                        intentType === 'cart_add' || 
                        intentType === 'wishlist_add';

    if (shouldUpdate) {
      await prisma.productIntent.update({
        where: { id: existingIntent.id },
        data: {
          intentScore: Math.max(intentScore, existingIntent.intentScore), // Keep highest score
          intentType: intentType === 'cart_add' ? 'cart_add' : existingIntent.intentType, // Prefer cart_add
          lastSeenAt: new Date(),
          expiresAt,
          sessionId: sessionId || existingIntent.sessionId,
          pageUrl: pageUrl || existingIntent.pageUrl,
          searchQuery: searchQuery || existingIntent.searchQuery,
          viewDuration: viewDuration || existingIntent.viewDuration,
        },
      });
      intentId = existingIntent.id;
      wasUpdated = true;
    } else {
      // Just update last seen
      await prisma.productIntent.update({
        where: { id: existingIntent.id },
        data: {
          lastSeenAt: new Date(),
        },
      });
      intentId = existingIntent.id;
    }
  } else {
    // Create new intent
    const newIntent = await prisma.productIntent.create({
      data: {
        brandId,
        profileId,
        productId,
        productName,
        category,
        intentType,
        intentScore,
        sourceChannel,
        sessionId,
        pageUrl,
        searchQuery,
        viewDuration,
        status: 'active',
        expiresAt,
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
      },
    });
    intentId = newIntent.id;
    isNew = true;
  }

  return {
    intentId,
    intentScore,
    isNew,
    wasUpdated,
  };
}

/**
 * Get active product intents for a customer
 */
export async function getActiveIntents(
  brandId: string,
  profileId: string,
  options?: {
    minScore?: number;
    limit?: number;
    sortBy?: 'score' | 'recent';
  }
): Promise<any[]> {
  const { minScore = 0, limit = 10, sortBy = 'score' } = options || {};

  const intents = await prisma.productIntent.findMany({
    where: {
      brandId,
      profileId,
      status: 'active',
      intentScore: { gte: minScore },
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
    orderBy: sortBy === 'score' 
      ? { intentScore: 'desc' }
      : { lastSeenAt: 'desc' },
    take: limit,
  });

  return intents;
}

/**
 * Mark intent as converted (customer purchased the product)
 */
export async function markIntentAsConverted(
  brandId: string,
  profileId: string,
  productId: string
): Promise<void> {
  await prisma.productIntent.updateMany({
    where: {
      brandId,
      profileId,
      productId,
      status: 'active',
    },
    data: {
      status: 'converted',
      convertedAt: new Date(),
    },
  });
}

/**
 * Expire old intents that haven't been seen recently
 */
export async function expireOldIntents(brandId?: string): Promise<number> {
  const where: any = {
    status: 'active',
    expiresAt: { lte: new Date() },
  };

  if (brandId) {
    where.brandId = brandId;
  }

  const result = await prisma.productIntent.updateMany({
    where,
    data: {
      status: 'expired',
    },
  });

  return result.count;
}

/**
 * Get high-intent products for a customer (score >= 50)
 */
export async function getHighIntentProducts(
  brandId: string,
  profileId: string,
  limit: number = 5
): Promise<any[]> {
  return getActiveIntents(brandId, profileId, {
    minScore: 50,
    limit,
    sortBy: 'score',
  });
}

