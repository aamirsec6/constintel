// GENERATOR: ANALYTICS_DASHBOARD
// Analytics dashboard API routes
// HOW TO USE: Mount this router in your main Express app: app.use('/api/analytics/dashboard', dashboardRouter)

import { Router, Request, Response } from 'express';
import { getDashboardMetrics } from '../../services/analytics/dashboardService';

const router = Router();

/**
 * GET /api/analytics/dashboard
 * Get dashboard metrics
 * Query params: startDate, endDate
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const brandId = req.headers['x-brand-id'] as string;

    if (!brandId) {
      return res.status(400).json({
        success: false,
        error: 'x-brand-id header is required',
      });
    }

    // Get date range from query params or use defaults
    const startDateStr = req.query.startDate as string;
    const endDateStr = req.query.endDate as string;

    const endDate = endDateStr ? new Date(endDateStr) : new Date();
    const startDate = startDateStr
      ? new Date(startDateStr)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: last 30 days

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD',
      });
    }

    const metrics = await getDashboardMetrics(brandId, startDate, endDate);

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error: any) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch dashboard metrics',
    });
  }
});

export default router;

