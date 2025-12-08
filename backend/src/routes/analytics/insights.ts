// GENERATOR: OLLAMA_INTEGRATION
// Analytics insights API routes
// HOW TO USE: Mount this router in your main Express app: app.use('/api/analytics/insights', insightsRouter)

import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest, requireBrandAccess } from '../../middleware/auth';
import { generateInsights } from '../../services/analytics/insightsService';
import { getTimeSeriesData } from '../../services/analytics/timeSeriesService';
import { getSegmentAnalytics } from '../../services/analytics/segmentAnalyticsService';

const router = Router();

// All routes require authentication and brand access
router.use(authenticate);
router.use(requireBrandAccess);

/**
 * POST /api/analytics/insights
 * Generate natural language insights from analytics data
 */
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const brandId = req.user!.brandId || req.headers['x-brand-id'] as string;
    
    if (!brandId) {
      return res.status(400).json({ success: false, error: 'Brand ID is required' });
    }

    const { startDate, endDate, metrics } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, error: 'startDate and endDate are required' });
    }

    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return res.status(400).json({ success: false, error: 'Invalid date format' });
    }

    // Fetch analytics data
    const metricsToFetch = metrics || ['revenue', 'orders', 'customers'];
    const analyticsData: any = {};

    // Fetch time series data for each metric
    for (const metric of metricsToFetch) {
      if (metric === 'revenue' || metric === 'orders' || metric === 'customers') {
        try {
          const timeSeries = await getTimeSeriesData(
            brandId,
            metric,
            startDateObj,
            endDateObj,
            'day'
          );
          
          analyticsData[metric] = {
            total: timeSeries.summary.total,
            average: timeSeries.summary.average,
            growth: timeSeries.summary.growth,
            trend: timeSeries.summary.growth && timeSeries.summary.growth > 0 ? 'increasing' : 'decreasing',
          };
        } catch (error) {
          console.warn(`Error fetching ${metric} data:`, error);
        }
      }
    }

    // Fetch segment analytics
    try {
      const segments = await getSegmentAnalytics(brandId, startDateObj, endDateObj);
      if (segments && segments.segments) {
        const segmentsData: any = {};
        segments.segments.forEach((seg: any) => {
          segmentsData[seg.name] = {
            count: seg.customerCount,
            revenue: seg.revenue,
          };
        });
        analyticsData.segments = segmentsData;
      }
    } catch (error) {
      console.warn('Error fetching segment data:', error);
    }

    // Generate insights
    const result = await generateInsights(
      brandId,
      { startDate: startDateObj, endDate: endDateObj },
      analyticsData
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error generating insights:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate insights',
    });
  }
});

/**
 * GET /api/analytics/insights
 * Get insights with query parameters
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const brandId = req.user!.brandId || req.headers['x-brand-id'] as string;
    
    if (!brandId) {
      return res.status(400).json({ success: false, error: 'Brand ID is required' });
    }

    const startDateStr = req.query.startDate as string;
    const endDateStr = req.query.endDate as string;
    const metrics = req.query.metrics ? (req.query.metrics as string).split(',') : undefined;

    if (!startDateStr || !endDateStr) {
      return res.status(400).json({ success: false, error: 'startDate and endDate query parameters are required' });
    }

    const startDateObj = new Date(startDateStr);
    const endDateObj = new Date(endDateStr);

    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return res.status(400).json({ success: false, error: 'Invalid date format' });
    }

    // Fetch analytics data
    const metricsToFetch = metrics || ['revenue', 'orders', 'customers'];
    const analyticsData: any = {};

    for (const metric of metricsToFetch) {
      if (metric === 'revenue' || metric === 'orders' || metric === 'customers') {
        try {
          const timeSeries = await getTimeSeriesData(
            brandId,
            metric,
            startDateObj,
            endDateObj,
            'day'
          );
          
          analyticsData[metric] = {
            total: timeSeries.summary.total,
            average: timeSeries.summary.average,
            growth: timeSeries.summary.growth,
            trend: timeSeries.summary.growth && timeSeries.summary.growth > 0 ? 'increasing' : 'decreasing',
          };
        } catch (error) {
          console.warn(`Error fetching ${metric} data:`, error);
        }
      }
    }

    // Fetch segment analytics
    try {
      const segments = await getSegmentAnalytics(brandId, startDateObj, endDateObj);
      if (segments && segments.segments) {
        const segmentsData: any = {};
        segments.segments.forEach((seg: any) => {
          segmentsData[seg.name] = {
            count: seg.customerCount,
            revenue: seg.revenue,
          };
        });
        analyticsData.segments = segmentsData;
      }
    } catch (error) {
      console.warn('Error fetching segment data:', error);
    }

    // Generate insights
    const result = await generateInsights(
      brandId,
      { startDate: startDateObj, endDate: endDateObj },
      analyticsData
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error generating insights:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate insights',
    });
  }
});

export default router;

