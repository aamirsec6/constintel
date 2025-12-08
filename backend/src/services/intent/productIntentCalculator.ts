// GENERATOR: OMNICHANNEL_PLATFORM
// ASSUMPTIONS: Product intent tracking service
// HOW TO RUN: Used by productIntentService to calculate intent scores

export interface IntentContext {
  intentType: string; // "product_view", "product_search", "cart_add", "wishlist_add"
  viewDuration?: number; // seconds
  searched?: boolean;
  addedToCart?: boolean;
  viewedMultipleTimes?: boolean;
  hoursSinceLastView?: number;
  sessionCount?: number; // Number of sessions where product was viewed
}

/**
 * Calculate product intent score (0-100) based on customer behavior
 * Higher score = higher purchase intent
 */
export function calculateIntentScore(context: IntentContext): number {
  let baseScore = 0;

  // Base scores by intent type
  const baseScores: Record<string, number> = {
    product_view: 20,
    product_search: 30,
    cart_add: 70,
    wishlist_add: 50,
    product_click: 25,
    multiple_views: 40, // Viewed same product multiple times
  };

  baseScore = baseScores[context.intentType] || 10;

  // Boosters based on engagement
  if (context.viewDuration) {
    if (context.viewDuration > 180) baseScore += 15; // Viewed > 3 min
    else if (context.viewDuration > 60) baseScore += 10; // Viewed > 1 min
    else if (context.viewDuration > 30) baseScore += 5; // Viewed > 30 sec
  }

  if (context.searched) baseScore += 20; // Actively searched
  if (context.addedToCart) baseScore += 30; // Added to cart
  if (context.viewedMultipleTimes) baseScore += 15; // Multiple sessions

  // Recency boost (more recent = higher score)
  if (context.hoursSinceLastView !== undefined) {
    if (context.hoursSinceLastView < 1) baseScore += 20; // Viewed in last hour
    else if (context.hoursSinceLastView < 24) baseScore += 10; // Viewed in last day
    else if (context.hoursSinceLastView < 72) baseScore += 5; // Viewed in last 3 days
  }

  // Session frequency boost
  if (context.sessionCount && context.sessionCount > 1) {
    baseScore += Math.min(10, context.sessionCount * 2); // +2 per additional session, max +10
  }

  return Math.min(100, Math.max(0, baseScore));
}

/**
 * Determine if intent should expire based on last seen date
 */
export function shouldExpireIntent(lastSeenAt: Date, expirationDays: number = 30): boolean {
  const expirationDate = new Date(lastSeenAt);
  expirationDate.setDate(expirationDate.getDate() + expirationDays);
  return new Date() > expirationDate;
}

/**
 * Calculate expiration date for intent
 */
export function calculateExpirationDate(days: number = 30): Date {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + days);
  return expirationDate;
}

