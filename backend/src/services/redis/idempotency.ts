// GENERATOR: PRD_REDIS_ARCHITECTURE
// Shopify Idempotency - Prevent duplicate order processing
// Uses Redis SET NX EX to track processed orders

import { getRedisClient } from './redisClient';

const IDEMPOTENCY_PREFIX = 'idempotency:shopify:';
const DEFAULT_TTL = 86400; // 24 hours

/**
 * Generate idempotency key from Shopify order
 */
export function generateIdempotencyKey(orderId: string, orderNumber?: string): string {
  return `${IDEMPOTENCY_PREFIX}${orderId}${orderNumber ? `:${orderNumber}` : ''}`;
}

/**
 * Check if order has already been processed (idempotency check)
 * Uses SET NX EX to atomically check and set
 * 
 * @param orderId - Shopify order ID
 * @param orderNumber - Optional order number
 * @returns true if order is new (not processed), false if duplicate
 */
export async function isOrderProcessed(
  orderId: string,
  orderNumber?: string
): Promise<boolean> {
  const client = await getRedisClient();
  const key = generateIdempotencyKey(orderId, orderNumber);
  
  try {
    // SET NX EX: Returns true if key was set (new order), false if exists (duplicate)
    const result = await client.setNX(key, '1');
    
    if (result) {
      // Set expiration (24 hours)
      await client.expire(key, DEFAULT_TTL);
      return false; // New order, not processed yet
    }
    
    return true; // Order already processed
  } catch (error) {
    console.error(`Error checking idempotency for order ${orderId}:`, error);
    // On error, assume not processed (fail open)
    return false;
  }
}

/**
 * Mark order as processed
 */
export async function markOrderProcessed(
  orderId: string,
  orderNumber?: string,
  metadata?: Record<string, any>
): Promise<void> {
  const client = await getRedisClient();
  const key = generateIdempotencyKey(orderId, orderNumber);
  
  try {
    const value = metadata ? JSON.stringify(metadata) : '1';
    await client.setEx(key, DEFAULT_TTL, value);
  } catch (error) {
    console.error(`Error marking order ${orderId} as processed:`, error);
  }
}

/**
 * Get order processing metadata
 */
export async function getOrderMetadata(
  orderId: string,
  orderNumber?: string
): Promise<Record<string, any> | null> {
  const client = await getRedisClient();
  const key = generateIdempotencyKey(orderId, orderNumber);
  
  try {
    const value = await client.get(key);
    if (!value) {
      return null;
    }
    
    try {
      return JSON.parse(value);
    } catch {
      return { processed: true };
    }
  } catch (error) {
    console.error(`Error getting metadata for order ${orderId}:`, error);
    return null;
  }
}

