// GENERATOR: PRD_REDIS_ARCHITECTURE
// Event Processing Worker
// Consumes events from Redis queue and processes them

import { dequeueEventBlocking, markEventCompleted, markEventFailed } from '../services/redis/eventQueue';
import { ingestEvent } from '../services/ingestion/eventIngestion';

const WORKER_NAME = `event-worker-${process.pid}`;
const POLL_INTERVAL = 1000; // 1 second
const MAX_RETRIES = 3;

let isRunning = false;
let shouldStop = false;

/**
 * Process a single event
 */
async function processEvent(event: any): Promise<void> {
  try {
    console.log(`[${WORKER_NAME}] Processing event: ${event.id} (${event.eventType})`);
    
    await ingestEvent({
      brandId: event.brandId,
      eventType: event.eventType,
      payload: event.payload,
    });
    
    await markEventCompleted(event.id);
    console.log(`[${WORKER_NAME}] ✅ Event ${event.id} processed successfully`);
  } catch (error: any) {
    console.error(`[${WORKER_NAME}] ❌ Error processing event ${event.id}:`, error);
    
    // Retry logic
    const retries = event.retries || 0;
    if (retries < MAX_RETRIES) {
      console.log(`[${WORKER_NAME}] Retrying event ${event.id} (attempt ${retries + 1}/${MAX_RETRIES})`);
      // Event will be re-queued by markEventFailed if needed
    }
    
    await markEventFailed(event, error);
  }
}

/**
 * Main worker loop
 */
async function workerLoop(): Promise<void> {
  console.log(`[${WORKER_NAME}] 🚀 Event worker started`);
  
  while (!shouldStop) {
    try {
      // Blocking dequeue (waits up to 5 seconds for event)
      const event = await dequeueEventBlocking(5);
      
      if (event) {
        await processEvent(event);
      }
      
      // Small delay to prevent tight loop
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
    } catch (error) {
      console.error(`[${WORKER_NAME}] Worker error:`, error);
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  console.log(`[${WORKER_NAME}] ⛔ Event worker stopped`);
}

/**
 * Start the event worker
 */
export async function startEventWorker(): Promise<void> {
  if (isRunning) {
    console.log(`[${WORKER_NAME}] Worker already running`);
    return;
  }
  
  isRunning = true;
  shouldStop = false;
  
  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log(`[${WORKER_NAME}] Received SIGTERM, shutting down gracefully...`);
    shouldStop = true;
  });
  
  process.on('SIGINT', () => {
    console.log(`[${WORKER_NAME}] Received SIGINT, shutting down gracefully...`);
    shouldStop = true;
  });
  
  await workerLoop();
  isRunning = false;
}

/**
 * Stop the event worker
 */
export function stopEventWorker(): void {
  shouldStop = true;
}

// Run worker if this file is executed directly
if (require.main === module) {
  startEventWorker().catch((error) => {
    console.error('Failed to start event worker:', error);
    process.exit(1);
  });
}

