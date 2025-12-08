// GENERATOR: OMNICHANNEL_PLATFORM
// ASSUMPTIONS: Express app, customer360 service available
// HOW TO RUN: app.use('/api/profiles', customer360Router)

import { Router, Request, Response } from 'express';
import { getCustomer360, getCustomerTimeline, getCustomerJourney, getCustomerHistory } from '../services/customer360/customer360Service';

const router = Router();

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

