// GENERATOR: PRD_REDIS_ARCHITECTURE
// Redis Client Service with connection pooling and error handling
// Uses: LPUSH, RPOP, SET NX EX, GET, DEL

import { createClient, RedisClientType } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

// Redis client singleton with connection pooling
let redisClient: RedisClientType | null = null;
let isConnecting = false;

/**
 * Get or create Redis client (singleton pattern)
 */
export async function getRedisClient(): Promise<RedisClientType> {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  if (isConnecting) {
    // Wait for connection to be established
    let attempts = 0;
    while (isConnecting && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      if (redisClient && redisClient.isOpen) {
        return redisClient;
      }
      attempts++;
    }
  }

  isConnecting = true;

  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    redisClient = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('Redis: Max reconnection attempts reached');
            return new Error('Max reconnection attempts reached');
          }
          return Math.min(retries * 100, 3000);
        },
      },
    }) as RedisClientType;

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis client connected');
    });

    redisClient.on('ready', () => {
      console.log('✅ Redis client ready');
      isConnecting = false;
    });

    redisClient.on('end', () => {
      console.log('Redis client connection ended');
      redisClient = null;
      isConnecting = false;
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    isConnecting = false;
    console.error('Failed to connect to Redis:', error);
    throw error;
  }
}

/**
 * Close Redis connection gracefully
 */
export async function closeRedisConnection(): Promise<void> {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    redisClient = null;
  }
}

/**
 * Health check for Redis
 */
export async function checkRedisHealth(): Promise<boolean> {
  try {
    const client = await getRedisClient();
    await client.ping();
    return true;
  } catch (error) {
    console.error('Redis health check failed:', error);
    return false;
  }
}

