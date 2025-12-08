// GENERATOR: FULL_PLATFORM
// ASSUMPTIONS: Express app, Prisma client available
// HOW TO RUN: app.use('/health', healthRouter)

import { Router, Request, Response } from 'express';
import { getPrismaClient } from '../db/prismaClient';

const router = Router();
const prisma = getPrismaClient();

/**
 * GET /health
 * Health check endpoint
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'disconnected',
      },
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;

