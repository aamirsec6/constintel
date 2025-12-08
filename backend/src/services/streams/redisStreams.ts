// GENERATOR: REDIS_STREAMS
// ASSUMPTIONS: Redis client available, REDIS_URL in env
// HOW TO RUN: Import and use: publishToStream(), createConsumerGroup(), readFromStream()
// TODO: Add error handling and retry logic for production

import { createClient, RedisClientType } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

// Stream topics
export const STREAM_TOPICS = {
  EVENTS_RAW: 'events.raw',
  EVENTS_NORMALIZED: 'events.normalized',
  PROFILES_MERGE_REQUESTS: 'profiles.merge_requests',
  PREDICTIONS_REQUESTS: 'predictions.requests',
} as const;

// Redis client singleton
let redisClient: RedisClientType | null = null;

/**
 * Get or create Redis client
 */
export async function getRedisClient(): Promise<RedisClientType> {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  redisClient = createClient({
    url: redisUrl,
  }) as RedisClientType;

  redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  await redisClient.connect();
  return redisClient;
}

/**
 * Publish event to a stream
 */
export async function publishToStream(
  stream: string,
  data: Record<string, string>,
  options?: { maxLength?: number }
): Promise<string> {
  const client = await getRedisClient();
  
  try {
    const id = await client.xAdd(stream, '*', data, {
      TRIM: options?.maxLength ? { strategy: 'MAXLEN', strategyModifier: '~', threshold: options.maxLength } : undefined,
    });
    return id;
  } catch (error) {
    console.error(`Error publishing to stream ${stream}:`, error);
    throw error;
  }
}

/**
 * Read from a stream (non-blocking)
 */
export async function readFromStream(
  stream: string,
  startId: string = '0',
  count?: number
): Promise<Array<{ id: string; fields: Record<string, string> }>> {
  const client = await getRedisClient();
  
  try {
    const messages = await client.xRead(
      { key: stream, id: startId },
      { COUNT: count, BLOCK: 0 }
    );

    if (!messages || messages.length === 0) {
      return [];
    }

    return messages[0].messages.map((msg) => ({
      id: msg.id,
      fields: msg.message as Record<string, string>,
    }));
  } catch (error) {
    console.error(`Error reading from stream ${stream}:`, error);
    throw error;
  }
}

/**
 * Read from stream with blocking (waits for new messages)
 */
export async function readFromStreamBlocking(
  stream: string,
  consumerGroup: string,
  consumerName: string,
  blockMs: number = 5000,
  count: number = 10
): Promise<Array<{ id: string; fields: Record<string, string> }>> {
  const client = await getRedisClient();
  
  try {
    const messages = await client.xReadGroup(
      consumerGroup,
      consumerName,
      { key: stream, id: '>' },
      { COUNT: count, BLOCK: blockMs }
    );

    if (!messages || messages.length === 0) {
      return [];
    }

    return messages[0].messages.map((msg) => ({
      id: msg.id,
      fields: msg.message as Record<string, string>,
    }));
  } catch (error) {
    console.error(`Error reading from stream ${stream} with consumer group:`, error);
    throw error;
  }
}

/**
 * Create a consumer group for a stream
 */
export async function createConsumerGroup(
  stream: string,
  groupName: string,
  startId: string = '0'
): Promise<void> {
  const client = await getRedisClient();
  
  try {
    await client.xGroupCreate(stream, groupName, startId, {
      MKSTREAM: true,
    });
    console.log(`✅ Created consumer group ${groupName} for stream ${stream}`);
  } catch (error: any) {
    // Group might already exist
    if (error.message?.includes('BUSYGROUP')) {
      console.log(`Consumer group ${groupName} already exists for stream ${stream}`);
    } else {
      console.error(`Error creating consumer group ${groupName}:`, error);
      throw error;
    }
  }
}

/**
 * Acknowledge message processing
 */
export async function acknowledgeMessage(
  stream: string,
  groupName: string,
  messageId: string
): Promise<void> {
  const client = await getRedisClient();
  
  try {
    await client.xAck(stream, groupName, messageId);
  } catch (error) {
    console.error(`Error acknowledging message ${messageId}:`, error);
    throw error;
  }
}

/**
 * Get stream info
 */
export async function getStreamInfo(stream: string): Promise<{
  length: number;
  firstEntry?: { id: string; fields: Record<string, string> };
  lastEntry?: { id: string; fields: Record<string, string> };
}> {
  const client = await getRedisClient();
  
  try {
    const info = await client.xInfoStream(stream);
    const length = info.length;
    
    // Get first and last entries
    const firstEntry = length > 0 ? await client.xRange(stream, '-', '+', { COUNT: 1 }) : [];
    const lastEntry = length > 0 ? await client.xRevRange(stream, '+', '-', { COUNT: 1 }) : [];

    return {
      length,
      firstEntry: firstEntry.length > 0 ? {
        id: firstEntry[0].id,
        fields: firstEntry[0].message as Record<string, string>,
      } : undefined,
      lastEntry: lastEntry.length > 0 ? {
        id: lastEntry[0].id,
        fields: lastEntry[0].message as Record<string, string>,
      } : undefined,
    };
  } catch (error: any) {
    if (error.message?.includes('no such key')) {
      return { length: 0 };
    }
    console.error(`Error getting stream info for ${stream}:`, error);
    throw error;
  }
}

/**
 * Get pending messages for a consumer group
 */
export async function getPendingMessages(
  stream: string,
  groupName: string,
  count: number = 10
): Promise<Array<{
  id: string;
  consumer: string;
  millisecondsSinceLastDelivery: number;
  timesDelivered: number;
}>> {
  const client = await getRedisClient();
  
  try {
    // Redis v4 API: xPending returns summary, need xPendingRange for messages
    const pendingInfo = await client.xPending(stream, groupName);
    
    if (!pendingInfo || pendingInfo.pending === 0) {
      return [];
    }

    // Get actual pending messages using xPendingRange
    const pendingMessages = await (client as any).xPendingRange(
      stream,
      groupName,
      '-',
      '+',
      count
    );

    if (!pendingMessages || pendingMessages.length === 0) {
      return [];
    }
    
    return pendingMessages.map((msg: any) => ({
      id: msg.id,
      consumer: msg.consumer || 'unknown',
      millisecondsSinceLastDelivery: msg.millisecondsSinceLastDelivery || 0,
      timesDelivered: msg.timesDelivered || 0,
    }));
  } catch (error) {
    console.error(`Error getting pending messages for ${stream}:`, error);
    throw error;
  }
}

/**
 * Claim pending messages (for failed consumers)
 */
export async function claimPendingMessages(
  stream: string,
  groupName: string,
  consumerName: string,
  minIdleTime: number = 60000, // 1 minute
  count: number = 10
): Promise<Array<{ id: string; fields: Record<string, string> }>> {
  const client = await getRedisClient();
  
  try {
    // First get pending message IDs
    const pending = await getPendingMessages(stream, groupName, count);
    if (pending.length === 0) {
      return [];
    }

    const messageIds = pending.map((msg) => msg.id);
    
    // Redis v4 API: xClaim signature
    const messages = await (client as any).xClaim(
      stream,
      groupName,
      consumerName,
      minIdleTime,
      messageIds,
      {
        COUNT: count,
      }
    );

    if (!messages || messages.length === 0) {
      return [];
    }

    return messages
      .filter((msg: any) => msg !== null && msg !== undefined)
      .map((msg: any) => ({
        id: msg.id,
        fields: (msg.message || {}) as Record<string, string>,
      }));
  } catch (error) {
    console.error(`Error claiming pending messages:`, error);
    throw error;
  }
}

/**
 * Close Redis connection
 */
export async function closeRedisConnection(): Promise<void> {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    redisClient = null;
  }
}

