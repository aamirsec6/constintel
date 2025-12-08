// GENERATOR: PRD_REDIS_ARCHITECTURE
// Automation Processing Worker
// Consumes automation tasks from Redis queue

import { dequeueAutomationTaskBlocking } from '../services/redis/automationQueue';
import { triggerAutomation } from '../services/automation/automationService';

const WORKER_NAME = `automation-worker-${process.pid}`;
const POLL_INTERVAL = 1000; // 1 second

let isRunning = false;
let shouldStop = false;

/**
 * Process a single automation task
 */
async function processAutomationTask(task: any): Promise<void> {
  try {
    console.log(`[${WORKER_NAME}] Processing automation: ${task.automationId} for profile ${task.profileId}`);
    
    await triggerAutomation(
      task.automationId,
      task.profileId,
      task.triggerType,
      task.triggerData
    );
    
    console.log(`[${WORKER_NAME}] ✅ Automation ${task.automationId} executed successfully`);
  } catch (error: any) {
    console.error(`[${WORKER_NAME}] ❌ Error processing automation ${task.automationId}:`, error);
    // Automation failures are logged but don't block the queue
  }
}

/**
 * Main worker loop
 */
async function workerLoop(): Promise<void> {
  console.log(`[${WORKER_NAME}] 🚀 Automation worker started`);
  
  while (!shouldStop) {
    try {
      // Blocking dequeue (waits up to 5 seconds for task)
      const task = await dequeueAutomationTaskBlocking(5);
      
      if (task) {
        await processAutomationTask(task);
      }
      
      // Small delay to prevent tight loop
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
    } catch (error) {
      console.error(`[${WORKER_NAME}] Worker error:`, error);
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  console.log(`[${WORKER_NAME}] ⛔ Automation worker stopped`);
}

/**
 * Start the automation worker
 */
export async function startAutomationWorker(): Promise<void> {
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
 * Stop the automation worker
 */
export function stopAutomationWorker(): void {
  shouldStop = true;
}

// Run worker if this file is executed directly
if (require.main === module) {
  startAutomationWorker().catch((error) => {
    console.error('Failed to start automation worker:', error);
    process.exit(1);
  });
}

