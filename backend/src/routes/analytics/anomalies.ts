// GENERATOR: OLLAMA_INTEGRATION
// Anomaly detection API routes
// HOW TO USE: Mount this router in your main Express app: app.use('/api/analytics/anomalies', anomaliesRouter)

import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest, requireBrandAccess } from '../../middleware/auth';
import { getAnomaliesWithExplanations } from '../../services/analytics/anomalyService';

const router = Router();

// All routes require authentication and brand access
router.use(authenticate);
router.use(requireBrandAccess);

/**
 * GET /api/analytics/anomalies
 * Get detected anomalies with explanations
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const brandId = req.user!.brandId || req.headers['x-brand-id'] as string;
    
    if (!brandId) {
      return res.status(400).json({ success: false, error: 'Brand ID is required' });
    }

    const startDateStr = req.query.startDate as string;
    const endDateStr = req.query.endDate as string;
    const metric = req.query.metric as 'revenue' | 'orders' | 'customers' | undefined;

    if (!startDateStr || !endDateStr) {
      return res.status(400).json({ success: false, error: 'startDate and endDate query parameters are required' });
    }

    const startDateObj = new Date(startDateStr);
    const endDateObj = new Date(endDateStr);

    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return res.status(400).json({ success: false, error: 'Invalid date format' });
    }

    // Get anomalies with explanations
    const anomalies = await getAnomaliesWithExplanations(
      brandId,
      startDateObj,
      endDateObj,
      metric
    );

    res.json({
      success: true,
      data: {
        anomalies,
        count: anomalies.length,
      },
    });
  } catch (error: any) {
    console.error('Error fetching anomalies:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch anomalies',
    });
  }
});

export default router;

