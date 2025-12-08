// GENERATOR: PRD_REDIS_ARCHITECTURE
// Event Queueing System using Redis LPUSH/RPOP
// Queue names: events:queue, events:processing, events:failed

import { getRedisClient } from './redisClient';

const QUEUE_NAMES = {
  EVENTS: 'events:queue',
  PROCESSING: 'events:processing',
  FAILED: 'events:failed',
} as const;

export interface QueuedEvent {
  id: string;
  brandId: string;
  eventType: string;
  payload: any;
  timestamp: string;
  retries?: number;
}

/**
 * Enqueue an event for processing (LPUSH)
 */
export async function enqueueEvent(event: Omit<QueuedEvent, 'id' | 'retries'>): Promise<string> {
  const client = await getRedisClient();
  const eventId = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const queuedEvent: QueuedEvent = {
    id: eventId,
    ...event,
    retries: 0,
  };

  // LPUSH: Add to left side of list (FIFO)
  await client.lPush(QUEUE_NAMES.EVENTS, JSON.stringify(queuedEvent));
  
  return eventId;
}

/**
 * Dequeue an event for processing (RPOP)
 * Returns null if queue is empty
 */
export async function dequeueEvent(): Promise<QueuedEvent | null> {
  const client = await getRedisClient();
  
  // RPOP: Remove from right side of list (FIFO)
  const eventData = await client.rPop(QUEUE_NAMES.EVENTS);
  
  if (!eventData) {
    return null;
  }

  try {
    const event = JSON.parse(eventData) as QueuedEvent;
    
    // Move to processing queue
    await client.lPush(QUEUE_NAMES.PROCESSING, eventData);
    
    return event;
  } catch (error) {
    console.error('Error parsing queued event:', error);
    return null;
  }
}

/**
 * Blocking dequeue (BRPOP - waits for event)
 */
export async function dequeueEventBlocking(timeoutSeconds: number = 5): Promise<QueuedEvent | null> {
  const client = await getRedisClient();
  
  // BRPOP: Blocking pop from right side (key, timeout)
  const result = await client.brPop(QUEUE_NAMES.EVENTS, timeoutSeconds);

  if (!result || !result.element) {
    return null;
  }

  try {
    const event = JSON.parse(result.element) as QueuedEvent;
    
    // Move to processing queue
    await client.lPush(QUEUE_NAMES.PROCESSING, result.element);
    
    return event;
  } catch (error) {
    console.error('Error parsing queued event:', error);
    return null;
  }
}

/**
 * Mark event as completed (remove from processing queue)
 */
export async function markEventCompleted(eventId: string): Promise<void> {
  const client = await getRedisClient();
  
  // Remove from processing queue
  const processingEvents = await client.lRange(QUEUE_NAMES.PROCESSING, 0, -1);
  for (const eventData of processingEvents) {
    try {
      const event = JSON.parse(eventData) as QueuedEvent;
      if (event.id === eventId) {
        await client.lRem(QUEUE_NAMES.PROCESSING, 1, eventData);
        break;
      }
    } catch (error) {
      // Skip invalid events
    }
  }
}

/**
 * Mark event as failed (move to failed queue)
 */
export async function markEventFailed(event: QueuedEvent, error: Error): Promise<void> {
  const client = await getRedisClient();
  
  const failedEvent = {
    ...event,
    error: error.message,
    failedAt: new Date().toISOString(),
  };

  // Add to failed queue
  await client.lPush(QUEUE_NAMES.FAILED, JSON.stringify(failedEvent));
  
  // Remove from processing queue
  await markEventCompleted(event.id);
}

/**
 * Retry failed event
 */
export async function retryFailedEvent(eventId: string): Promise<boolean> {
  const client = await getRedisClient();
  
  const failedEvents = await client.lRange(QUEUE_NAMES.FAILED, 0, -1);
  for (const eventData of failedEvents) {
    try {
      const event = JSON.parse(eventData) as QueuedEvent & { error?: string; failedAt?: string };
      if (event.id === eventId) {
        // Remove from failed queue
        await client.lRem(QUEUE_NAMES.FAILED, 1, eventData);
        
        // Re-enqueue with incremented retry count
        const retryEvent: QueuedEvent = {
          ...event,
          retries: (event.retries || 0) + 1,
        };
        delete (retryEvent as any).error;
        delete (retryEvent as any).failedAt;
        
        await client.lPush(QUEUE_NAMES.EVENTS, JSON.stringify(retryEvent));
        return true;
      }
    } catch (error) {
      // Skip invalid events
    }
  }
  
  return false;
}

/**
 * Get queue stats
 */
export async function getQueueStats(): Promise<{
  pending: number;
  processing: number;
  failed: number;
}> {
  const client = await getRedisClient();
  
  const [pending, processing, failed] = await Promise.all([
    client.lLen(QUEUE_NAMES.EVENTS),
    client.lLen(QUEUE_NAMES.PROCESSING),
    client.lLen(QUEUE_NAMES.FAILED),
  ]);

  return { pending, processing, failed };
}

