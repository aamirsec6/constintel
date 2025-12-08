// GENERATOR: ANALYTICS_DASHBOARD
// Segment analytics API routes
// HOW TO USE: Mount this router in your main Express app: app.use('/api/analytics/segments', segmentsRouter)

import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest, requireBrandAccess } from '../../middleware/auth';
import { getSegmentAnalytics } from '../../services/analytics/segmentAnalyticsService';

const router = Router();

router.use(authenticate);
router.use(requireBrandAccess);

/**
 * GET /api/analytics/segments
 * Get segment analytics
 * Query params: startDate, endDate
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const brandId = req.user!.brandId || req.headers['x-brand-id'] as string;
    
    if (!brandId) {
      return res.status(400).json({ success: false, error: 'Brand ID is required' });
    }

    const startDateStr = req.query.startDate as string;
    const endDateStr = req.query.endDate as string;

    if (!startDateStr || !endDateStr) {
      return res.status(400).json({ success: false, error: 'startDate and endDate are required' });
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ success: false, error: 'Invalid date format' });
    }

    const data = await getSegmentAnalytics(brandId, startDate, endDate);

    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Error fetching segment analytics:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch segment analytics' });
  }
});

export default router;
