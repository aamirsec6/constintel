// GENERATOR: PRD_REDIS_ARCHITECTURE
// Automation Task Queue using Redis
// Queue name: automation:queue

import { getRedisClient } from './redisClient';

const QUEUE_NAME = 'automation:queue';

export interface AutomationTask {
  id: string;
  automationId: string;
  brandId: string;
  profileId: string;
  triggerType: string;
  triggerData: any;
  timestamp: string;
  priority?: number; // Higher priority = processed first
}

/**
 * Enqueue automation task
 */
export async function enqueueAutomationTask(
  task: Omit<AutomationTask, 'id' | 'timestamp'>
): Promise<string> {
  const client = await getRedisClient();
  const taskId = `auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const fullTask: AutomationTask = {
    id: taskId,
    ...task,
    timestamp: new Date().toISOString(),
    priority: task.priority || 0,
  };

  // For priority queue, we could use sorted sets (ZADD)
  // For simplicity, using LPUSH (FIFO)
  await client.lPush(QUEUE_NAME, JSON.stringify(fullTask));
  
  return taskId;
}

/**
 * Dequeue automation task
 */
export async function dequeueAutomationTask(): Promise<AutomationTask | null> {
  const client = await getRedisClient();
  
  const taskData = await client.rPop(QUEUE_NAME);
  
  if (!taskData) {
    return null;
  }

  try {
    return JSON.parse(taskData) as AutomationTask;
  } catch (error) {
    console.error('Error parsing automation task:', error);
    return null;
  }
}

/**
 * Blocking dequeue for automation tasks
 */
export async function dequeueAutomationTaskBlocking(
  timeoutSeconds: number = 5
): Promise<AutomationTask | null> {
  const client = await getRedisClient();
  
  const result = await client.brPop(
    { key: QUEUE_NAME, timeout: timeoutSeconds },
    1
  );

  if (!result || !result.element) {
    return null;
  }

  try {
    return JSON.parse(result.element) as AutomationTask;
  } catch (error) {
    console.error('Error parsing automation task:', error);
    return null;
  }
}

/**
 * Get automation queue stats
 */
export async function getAutomationQueueStats(): Promise<{
  pending: number;
}> {
  const client = await getRedisClient();
  const pending = await client.lLen(QUEUE_NAME);
  return { pending };
}

