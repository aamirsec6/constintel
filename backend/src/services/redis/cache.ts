// GENERATOR: PRD_REDIS_ARCHITECTURE
// Customer360 Caching using Redis GET/SET
// Cache key format: cache:customer360:{brandId}:{profileId}

import { getRedisClient } from './redisClient';

const CACHE_PREFIX = 'cache:customer360:';
const DEFAULT_TTL = 300; // 5 minutes

/**
 * Generate cache key for Customer360
 */
function getCacheKey(brandId: string, profileId: string): string {
  return `${CACHE_PREFIX}${brandId}:${profileId}`;
}

/**
 * Get cached Customer360 data
 * 
 * @param brandId - Brand ID
 * @param profileId - Profile ID
 * @returns Cached data or null if not found/expired
 */
export async function getCustomer360Cache(
  brandId: string,
  profileId: string
): Promise<any | null> {
  try {
  const client = await getRedisClient();
  const key = getCacheKey(brandId, profileId);
  
  try {
    const cached = await client.get(key);
    if (!cached) {
      return null;
    }
    
    return JSON.parse(cached);
  } catch (error) {
    console.error(`Error getting cache for ${profileId}:`, error);
      return null;
    }
  } catch (error) {
    // Redis not available - return null to proceed without cache
    console.warn('Redis not available, skipping cache lookup');
    return null;
  }
}

/**
 * Set Customer360 cache
 * 
 * @param brandId - Brand ID
 * @param profileId - Profile ID
 * @param data - Data to cache
 * @param ttlSeconds - Cache TTL in seconds (default 5 minutes)
 */
export async function setCustomer360Cache(
  brandId: string,
  profileId: string,
  data: any,
  ttlSeconds: number = DEFAULT_TTL
): Promise<void> {
  try {
  const client = await getRedisClient();
  const key = getCacheKey(brandId, profileId);
  
  try {
    const serialized = JSON.stringify(data);
    await client.setEx(key, ttlSeconds, serialized);
  } catch (error) {
    console.error(`Error setting cache for ${profileId}:`, error);
    }
  } catch (error) {
    // Redis not available - skip caching
    console.warn('Redis not available, skipping cache write');
  }
}

/**
 * Invalidate Customer360 cache
 * 
 * @param brandId - Brand ID
 * @param profileId - Profile ID
 */
export async function invalidateCustomer360Cache(
  brandId: string,
  profileId: string
): Promise<void> {
  const client = await getRedisClient();
  const key = getCacheKey(brandId, profileId);
  
  try {
    await client.del(key);
  } catch (error) {
    console.error(`Error invalidating cache for ${profileId}:`, error);
  }
}

/**
 * Invalidate all Customer360 caches for a brand
 */
export async function invalidateBrandCustomer360Cache(brandId: string): Promise<void> {
  const client = await getRedisClient();
  const pattern = `${CACHE_PREFIX}${brandId}:*`;
  
  try {
    // Note: SCAN is better for production, but KEYS works for small datasets
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
    }
  } catch (error) {
    console.error(`Error invalidating brand cache for ${brandId}:`, error);
  }
}

