// GENERATOR: PRD_REDIS_ARCHITECTURE
// Monitoring and Health Check Routes

import { Router, Request, Response } from 'express';
import { checkRedisHealth } from '../services/redis/redisClient';
import { getQueueStats } from '../services/redis/eventQueue';
import { getAutomationQueueStats } from '../services/redis/automationQueue';
import { getPrismaClient } from '../db/prismaClient';

const router = Router();
const prisma = getPrismaClient();

/**
 * GET /api/monitoring/health
 * Overall health check
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const checks = {
      database: false,
      redis: false,
      timestamp: new Date().toISOString(),
    };

    // Check database
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = true;
    } catch (error) {
      console.error('Database health check failed:', error);
    }

    // Check Redis
    checks.redis = await checkRedisHealth();

    const isHealthy = checks.database && checks.redis;

    res.status(isHealthy ? 200 : 503).json({
      success: isHealthy,
      checks,
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/monitoring/queues
 * Get queue statistics
 */
router.get('/queues', async (req: Request, res: Response) => {
  try {
    const [eventQueue, automationQueue] = await Promise.all([
      getQueueStats(),
      getAutomationQueueStats(),
    ]);

    res.json({
      success: true,
      data: {
        events: eventQueue,
        automation: automationQueue,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/monitoring/stats
 * Get system statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const brandId = req.headers['x-brand-id'] as string;

    const [totalProfiles, totalEvents, queueStats] = await Promise.all([
      brandId
        ? prisma.customerProfile.count({ where: { brandId } })
        : prisma.customerProfile.count(),
      brandId
        ? prisma.customerRawEvent.count({ where: { brandId } })
        : prisma.customerRawEvent.count(),
      getQueueStats(),
    ]);

    res.json({
      success: true,
      data: {
        profiles: totalProfiles,
        events: totalEvents,
        queues: queueStats,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;

