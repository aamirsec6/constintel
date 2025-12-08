// GENERATOR: ANALYTICS_DASHBOARD
// Time series analytics API routes
// HOW TO USE: Mount this router in your main Express app: app.use('/api/analytics/timeseries', timeSeriesRouter)

import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest, requireBrandAccess } from '../../middleware/auth';
import { getTimeSeriesData, getMultipleTimeSeries, TimeGranularity, MetricType } from '../../services/analytics/timeSeriesService';

const router = Router();

// All routes require authentication and brand access
router.use(authenticate);
router.use(requireBrandAccess);

/**
 * GET /api/analytics/timeseries
 * Get time series data for a specific metric
 * Query params: metric, startDate, endDate, granularity
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const brandId = req.user!.brandId || req.headers['x-brand-id'] as string;
    
    if (!brandId) {
      return res.status(400).json({ success: false, error: 'Brand ID is required' });
    }

    const metric = req.query.metric as MetricType;
    const startDateStr = req.query.startDate as string;
    const endDateStr = req.query.endDate as string;
    const granularity = (req.query.granularity as TimeGranularity) || 'day';

    if (!metric) {
      return res.status(400).json({ success: false, error: 'Metric parameter is required' });
    }

    if (!startDateStr || !endDateStr) {
      return res.status(400).json({ success: false, error: 'startDate and endDate are required' });
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ success: false, error: 'Invalid date format' });
    }

    const data = await getTimeSeriesData(brandId, metric, startDate, endDate, granularity);

    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Error fetching time series data:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch time series data' });
  }
});

/**
 * POST /api/analytics/timeseries/multiple
 * Get multiple metrics at once
 * Body: { metrics: string[], startDate: string, endDate: string, granularity?: string }
 */
router.post('/multiple', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const brandId = req.user!.brandId || req.headers['x-brand-id'] as string;
    
    if (!brandId) {
      return res.status(400).json({ success: false, error: 'Brand ID is required' });
    }

    const { metrics, startDate, endDate, granularity = 'day' } = req.body;

    if (!metrics || !Array.isArray(metrics) || metrics.length === 0) {
      return res.status(400).json({ success: false, error: 'metrics array is required' });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, error: 'startDate and endDate are required' });
    }

    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return res.status(400).json({ success: false, error: 'Invalid date format' });
    }

    const data = await getMultipleTimeSeries(
      brandId,
      metrics as MetricType[],
      startDateObj,
      endDateObj,
      granularity as TimeGranularity
    );

    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Error fetching multiple time series:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch time series data' });
  }
});

export default router;
