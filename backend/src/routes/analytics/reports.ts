// GENERATOR: OLLAMA_INTEGRATION
// Report generation API routes
// HOW TO USE: Mount this router in your main Express app: app.use('/api/analytics/reports', reportsRouter)

import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest, requireBrandAccess } from '../../middleware/auth';
import { generateReport } from '../../services/analytics/reportService';
import { getTimeSeriesData } from '../../services/analytics/timeSeriesService';
import { getSegmentAnalytics } from '../../services/analytics/segmentAnalyticsService';
import { generateInsights } from '../../services/analytics/insightsService';

const router = Router();

// All routes require authentication and brand access
router.use(authenticate);
router.use(requireBrandAccess);

/**
 * POST /api/analytics/reports/generate
 * Generate a comprehensive analytics report
 */
router.post('/generate', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const brandId = req.user!.brandId || req.headers['x-brand-id'] as string;
    
    if (!brandId) {
      return res.status(400).json({ success: false, error: 'Brand ID is required' });
    }

    const { startDate, endDate, format, sections } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, error: 'startDate and endDate are required' });
    }

    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return res.status(400).json({ success: false, error: 'Invalid date format' });
    }

    // Fetch comprehensive analytics data
    const analyticsData: any = {};

    // Fetch revenue data
    try {
      const revenue = await getTimeSeriesData(brandId, 'revenue', startDateObj, endDateObj, 'day');
      analyticsData.revenue = {
        total: revenue.summary.total,
        average: revenue.summary.average,
        growth: revenue.summary.growth,
        trend: revenue.summary.growth && revenue.summary.growth > 0 ? 'increasing' : 'decreasing',
      };
    } catch (error) {
      console.warn('Error fetching revenue data:', error);
    }

    // Fetch orders data
    try {
      const orders = await getTimeSeriesData(brandId, 'orders', startDateObj, endDateObj, 'day');
      analyticsData.orders = {
        total: orders.summary.total,
        avgOrderValue: orders.summary.average,
      };
    } catch (error) {
      console.warn('Error fetching orders data:', error);
    }

    // Fetch customers data
    try {
      const customers = await getTimeSeriesData(brandId, 'customers', startDateObj, endDateObj, 'day');
      analyticsData.customers = {
        total: customers.summary.total,
        new: 0, // Would need separate query
        active: customers.summary.total,
      };
    } catch (error) {
      console.warn('Error fetching customers data:', error);
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

    // Generate insights if requested
    if (!sections || sections.includes('insights')) {
      try {
        const insightsResult = await generateInsights(
          brandId,
          { startDate: startDateObj, endDate: endDateObj },
          analyticsData
        );
        analyticsData.insights = insightsResult.insights;
      } catch (error) {
        console.warn('Error generating insights:', error);
      }
    }

    // Generate report
    const result = await generateReport(
      brandId,
      { startDate: startDateObj, endDate: endDateObj },
      analyticsData,
      {
        format: format || 'markdown',
        sections: sections || ['executive_summary', 'metrics', 'insights', 'recommendations'],
      }
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error generating report:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate report',
    });
  }
});

export default router;

