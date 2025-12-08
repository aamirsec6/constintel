// GENERATOR: ANALYTICS_DASHBOARD
// Channel attribution API routes
// HOW TO USE: Mount this router in your main Express app: app.use('/api/analytics/channels', channelsRouter)

import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest, requireBrandAccess } from '../../middleware/auth';
import { getChannelAttribution, AttributionModel } from '../../services/analytics/channelAttributionService';

const router = Router();

router.use(authenticate);
router.use(requireBrandAccess);

/**
 * GET /api/analytics/channels
 * Get channel attribution analysis
 * Query params: model, startDate, endDate
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const brandId = req.user!.brandId || req.headers['x-brand-id'] as string;
    
    if (!brandId) {
      return res.status(400).json({ success: false, error: 'Brand ID is required' });
    }

    const model = (req.query.model as AttributionModel) || 'last_touch';
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

    const data = await getChannelAttribution(brandId, model, startDate, endDate);

    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Error fetching channel attribution:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch channel attribution' });
  }
});

export default router;
