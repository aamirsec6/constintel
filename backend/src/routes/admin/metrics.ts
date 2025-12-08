// GENERATOR: AUTH_SYSTEM
// Admin metrics routes
// HOW TO USE: Mount at /api/admin/metrics with requireAdmin middleware

import { Router, Response } from 'express';
import {
  authenticate,
  requireAdmin,
  AuthenticatedRequest,
} from '../../middleware/auth';
import {
  getBrandMetrics,
  getAllBrandsLatestMetrics,
  getPlatformAverageMetrics,
} from '../../services/metrics/brandMetricsService';

const router = Router();

// All routes require admin
router.use(authenticate);
router.use(requireAdmin);

/**
 * GET /api/admin/metrics/brands/:id
 * Get metrics for a specific brand
 */
router.get('/brands/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const days = req.query.days
      ? parseInt(req.query.days as string, 10)
      : 30;

    const metrics = await getBrandMetrics(req.params.id, days);

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get brand metrics',
    });
  }
});

/**
 * GET /api/admin/metrics/all
 * Get latest metrics for all brands
 */
router.get('/all', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const brands = await getAllBrandsLatestMetrics();

    res.json({
      success: true,
      data: brands,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get brands metrics',
    });
  }
});

/**
 * GET /api/admin/metrics/platform-average
 * Get platform average metrics
 */
router.get('/platform-average', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const average = await getPlatformAverageMetrics();

    res.json({
      success: true,
      data: average,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get platform average',
    });
  }
});

export default router;

