// GENERATOR: OMNICHANNEL_PLATFORM
// ASSUMPTIONS: Express app, store dashboard service available
// HOW TO RUN: app.use('/api/store', storeDashboardRouter)

import { Router, Request, Response } from 'express';
import { getStoreDashboard, lookupCustomer, getCustomerRecommendations } from '../../services/store/storeDashboardService';

const router = Router();

/**
 * GET /api/store/dashboard/:storeId
 * Get store dashboard data
 */
router.get('/dashboard/:storeId', async (req: Request, res: Response) => {
  try {
    const brandId = req.headers['x-brand-id'] as string;
    const { storeId } = req.params;

    if (!brandId) {
      return res.status(400).json({
        success: false,
        error: 'x-brand-id header is required',
      });
    }

    const dashboard = await getStoreDashboard(brandId, storeId);

    res.json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    console.error('Error fetching store dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/store/lookup/:storeId
 * Lookup customer by identifier
 */
router.get('/lookup/:storeId', async (req: Request, res: Response) => {
  try {
    const brandId = req.headers['x-brand-id'] as string;
    const { storeId } = req.params;
    const identifier = req.query.identifier as string;

    if (!brandId) {
      return res.status(400).json({
        success: false,
        error: 'x-brand-id header is required',
      });
    }

    if (!identifier) {
      return res.status(400).json({
        success: false,
        error: 'identifier query parameter is required',
      });
    }

    const customer = await lookupCustomer(brandId, storeId, identifier);

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found',
      });
    }

    res.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error('Error looking up customer:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/store/recommendations/:profileId
 * Get product recommendations for customer
 */
router.get('/recommendations/:profileId', async (req: Request, res: Response) => {
  try {
    const brandId = req.headers['x-brand-id'] as string;
    const { profileId } = req.params;

    if (!brandId) {
      return res.status(400).json({
        success: false,
        error: 'x-brand-id header is required',
      });
    }

    const recommendations = await getCustomerRecommendations(brandId, profileId);

    res.json({
      success: true,
      data: recommendations,
    });
  } catch (error: any) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

export default router;

