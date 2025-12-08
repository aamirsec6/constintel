// GENERATOR: FULL_PLATFORM
// ASSUMPTIONS: Express app, Prisma client available
// HOW TO RUN: app.use('/api/profiles', profilesRouter)

import { Router, Request, Response } from 'express';
import { getPrismaClient } from '../db/prismaClient';
import { getCustomer360, getCustomerTimeline, getCustomerJourney, getCustomerHistory } from '../services/customer360/customer360Service';

const router = Router();
const prisma = getPrismaClient();

/**
 * GET /api/profiles/:id
 * Get customer profile by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const brandId = req.headers['x-brand-id'] as string;

    if (!brandId) {
      return res.status(400).json({ error: 'x-brand-id header required' });
    }

    const profile = await prisma.customerProfile.findFirst({
      where: {
        id,
        brandId,
      },
      include: {
        rawEvents: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        predictions: true,
        features: true,
      },
    });

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({ success: true, data: profile });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/profiles
 * List profiles with pagination
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const brandId = req.headers['x-brand-id'] as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;

    if (!brandId) {
      return res.status(400).json({ error: 'x-brand-id header required' });
    }

    const [profiles, total] = await Promise.all([
      prisma.customerProfile.findMany({
        where: { brandId },
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          predictions: true,
        },
      }),
      prisma.customerProfile.count({ where: { brandId } }),
    ]);

    res.json({
      success: true,
      data: profiles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error listing profiles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/profiles/:id/360
 * Complete 360 view
 */
router.get('/:id/360', async (req: Request, res: Response) => {
  try {
    const brandId = req.headers['x-brand-id'] as string;
    const { id } = req.params;

    if (!brandId) {
      return res.status(400).json({
        success: false,
        error: 'x-brand-id header is required',
      });
    }

    const data = await getCustomer360(brandId, id);

    res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Error fetching customer 360:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

/**
 * GET /api/profiles/:id/timeline
 * Interaction timeline
 */
router.get('/:id/timeline', async (req: Request, res: Response) => {
  try {
    const brandId = req.headers['x-brand-id'] as string;
    const { id } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;

    if (!brandId) {
      return res.status(400).json({
        success: false,
        error: 'x-brand-id header is required',
      });
    }

    const timeline = await getCustomerTimeline(brandId, id, limit);

    res.json({
      success: true,
      data: timeline,
      count: timeline.length,
    });
  } catch (error: any) {
    console.error('Error fetching customer timeline:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

/**
 * GET /api/profiles/:id/journey
 * Customer journey stages
 */
router.get('/:id/journey', async (req: Request, res: Response) => {
  try {
    const brandId = req.headers['x-brand-id'] as string;
    const { id } = req.params;

    if (!brandId) {
      return res.status(400).json({
        success: false,
        error: 'x-brand-id header is required',
      });
    }

    const journey = await getCustomerJourney(brandId, id);

    res.json({
      success: true,
      data: journey,
    });
  } catch (error: any) {
    console.error('Error fetching customer journey:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

/**
 * GET /api/profiles/:id/history
 * Complete interaction history
 */
router.get('/:id/history', async (req: Request, res: Response) => {
  try {
    const brandId = req.headers['x-brand-id'] as string;
    const { id } = req.params;

    if (!brandId) {
      return res.status(400).json({
        success: false,
        error: 'x-brand-id header is required',
      });
    }

    const history = await getCustomerHistory(brandId, id);

    res.json({
      success: true,
      data: history,
    });
  } catch (error: any) {
    console.error('Error fetching customer history:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

export default router;

