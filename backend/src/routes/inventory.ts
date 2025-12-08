// GENERATOR: OMNICHANNEL_PLATFORM
// ASSUMPTIONS: Express app, inventory service available
// HOW TO RUN: app.use('/api/inventory', inventoryRouter)

import { Router, Request, Response } from 'express';
import { getTrendingProducts, getDemandSignals, getStoreRecommendations, getProductInsights } from '../services/inventory/inventoryService';

const router = Router();

/**
 * GET /api/inventory/trending
 * Get trending products
 */
router.get('/trending', async (req: Request, res: Response) => {
  try {
    const brandId = req.headers['x-brand-id'] as string;
    if (!brandId) {
      return res.status(400).json({
        success: false,
        error: 'x-brand-id header is required',
      });
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const timeWindow = req.query.time_window ? parseInt(req.query.time_window as string) : 7;
    const minIntentScore = req.query.min_intent_score ? parseFloat(req.query.min_intent_score as string) : 30;

    const trending = await getTrendingProducts(brandId, {
      limit,
      timeWindow,
      minIntentScore,
    });

    res.json({
      success: true,
      data: trending,
      count: trending.length,
    });
  } catch (error) {
    console.error('Error fetching trending products:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/inventory/demand-signals
 * Get demand signals by product
 */
router.get('/demand-signals', async (req: Request, res: Response) => {
  try {
    const brandId = req.headers['x-brand-id'] as string;
    if (!brandId) {
      return res.status(400).json({
        success: false,
        error: 'x-brand-id header is required',
      });
    }

    const productId = req.query.product_id as string | undefined;
    const signals = await getDemandSignals(brandId, productId);

    res.json({
      success: true,
      data: signals,
      count: signals.length,
    });
  } catch (error) {
    console.error('Error fetching demand signals:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/inventory/store/:storeId/recommendations
 * Get store inventory recommendations
 */
router.get('/store/:storeId/recommendations', async (req: Request, res: Response) => {
  try {
    const brandId = req.headers['x-brand-id'] as string;
    const { storeId } = req.params;

    if (!brandId) {
      return res.status(400).json({
        success: false,
        error: 'x-brand-id header is required',
      });
    }

    const recommendations = await getStoreRecommendations(brandId, storeId);

    res.json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    console.error('Error fetching store recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/inventory/product/:productId/insights
 * Get product insights
 */
router.get('/product/:productId/insights', async (req: Request, res: Response) => {
  try {
    const brandId = req.headers['x-brand-id'] as string;
    const { productId } = req.params;

    if (!brandId) {
      return res.status(400).json({
        success: false,
        error: 'x-brand-id header is required',
      });
    }

    const insights = await getProductInsights(brandId, productId);

    res.json({
      success: true,
      data: insights,
    });
  } catch (error) {
    console.error('Error fetching product insights:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;

