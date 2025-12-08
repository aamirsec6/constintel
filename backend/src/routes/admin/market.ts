// GENERATOR: AUTH_SYSTEM
// Admin market data routes (stock market-style)
// HOW TO USE: Mount at /api/admin/market with requireAdmin middleware

import { Router, Response } from 'express';
import {
  authenticate,
  requireAdmin,
  AuthenticatedRequest,
} from '../../middleware/auth';
import {
  getMarketData,
  getBrandMarketData,
} from '../../services/metrics/marketDataService';

const router = Router();

// All routes require admin
router.use(authenticate);
router.use(requireAdmin);

/**
 * GET /api/admin/market
 * Get market data for all brands (stock market format)
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const marketData = await getMarketData();

    res.json({
      success: true,
      data: marketData,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get market data',
    });
  }
});

/**
 * GET /api/admin/market/brand/:id
 * Get market data for a specific brand
 */
router.get('/brand/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const brandData = await getBrandMarketData(req.params.id);

    if (!brandData) {
      res.status(404).json({
        success: false,
        error: 'Brand not found or no metrics available',
      });
      return;
    }

    res.json({
      success: true,
      data: brandData,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get brand market data',
    });
  }
});

export default router;

