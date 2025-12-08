// GENERATOR: PRD_REDIS_ARCHITECTURE
// Identity Merge Locking using Redis SET NX EX
// Prevents race conditions during profile merging

import { getRedisClient } from './redisClient';

const LOCK_PREFIX = 'lock:merge:';
const DEFAULT_LOCK_TTL = 30; // 30 seconds

/**
 * Acquire a lock for identity merge operation
 * Uses SET NX EX (set if not exists with expiration)
 * 
 * @param profileId - Profile ID to lock
 * @param ttlSeconds - Lock expiration time in seconds
 * @returns Lock key if acquired, null if already locked
 */
export async function acquireMergeLock(
  profileId: string,
  ttlSeconds: number = DEFAULT_LOCK_TTL
): Promise<string | null> {
  const client = await getRedisClient();
  const lockKey = `${LOCK_PREFIX}${profileId}`;
  
  try {
    // SET NX EX: Set if not exists with expiration
    const result = await client.setNX(lockKey, '1');
    
    if (result) {
      // Set expiration
      await client.expire(lockKey, ttlSeconds);
      return lockKey;
    }
    
    return null; // Lock already exists
  } catch (error) {
    console.error(`Error acquiring lock for ${profileId}:`, error);
    return null;
  }
}

/**
 * Release a merge lock
 * 
 * @param lockKey - Lock key returned from acquireMergeLock
 */
export async function releaseMergeLock(lockKey: string): Promise<void> {
  const client = await getRedisClient();
  
  try {
    await client.del(lockKey);
  } catch (error) {
    console.error(`Error releasing lock ${lockKey}:`, error);
  }
}

/**
 * Execute a function with a merge lock
 * Automatically acquires and releases the lock
 * 
 * @param profileId - Profile ID to lock
 * @param fn - Function to execute while locked
 * @param ttlSeconds - Lock expiration time
 */
export async function withMergeLock<T>(
  profileId: string,
  fn: () => Promise<T>,
  ttlSeconds: number = DEFAULT_LOCK_TTL
): Promise<T> {
  const lockKey = await acquireMergeLock(profileId, ttlSeconds);
  
  if (!lockKey) {
    throw new Error(`Could not acquire lock for profile ${profileId}`);
  }

  try {
    return await fn();
  } finally {
    await releaseMergeLock(lockKey);
  }
}

/**
 * Check if a profile is currently locked
 */
export async function isProfileLocked(profileId: string): Promise<boolean> {
  const client = await getRedisClient();
  const lockKey = `${LOCK_PREFIX}${profileId}`;
  
  try {
    const exists = await client.exists(lockKey);
    return exists === 1;
  } catch (error) {
    console.error(`Error checking lock for ${profileId}:`, error);
    return false;
  }
}

/**
 * Extend lock expiration
 */
export async function extendMergeLock(profileId: string, ttlSeconds: number = DEFAULT_LOCK_TTL): Promise<boolean> {
  const client = await getRedisClient();
  const lockKey = `${LOCK_PREFIX}${profileId}`;
  
  try {
    const exists = await client.exists(lockKey);
    if (exists === 1) {
      await client.expire(lockKey, ttlSeconds);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error extending lock for ${profileId}:`, error);
    return false;
  }
}

