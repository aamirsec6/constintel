// GENERATOR: SIRI_LIKE_LLM
// Natural language query API routes with conversation support
// HOW TO USE: Mount this router in your main Express app: app.use('/api/analytics/ask', askRouter)

import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest, requireBrandAccess } from '../../middleware/auth';
import { answerQuery } from '../../services/analytics/queryService';
import { getTimeSeriesData } from '../../services/analytics/timeSeriesService';
import { getSegmentAnalytics } from '../../services/analytics/segmentAnalyticsService';
import { createSession, addMessage, getConversationHistory } from '../../services/analytics/conversationService';
import { getBrandContext, formatBrandContextForPrompt } from '../../services/analytics/brandContextService';

const router = Router();

// All routes require authentication and brand access
router.use(authenticate);
router.use(requireBrandAccess);

/**
 * POST /api/analytics/ask
 * Answer a natural language question about analytics data
 */
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Get brandId from user token, header, or body (in order of preference)
    const brandId = req.user?.brandId || 
                    (req.headers['x-brand-id'] as string) || 
                    req.body.brandId;
    
    if (!brandId) {
      return res.status(400).json({ success: false, error: 'Brand ID is required. Please provide x-brand-id header.' });
    }

    const { question, startDate, endDate, sessionId } = req.body;

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Question is required' });
    }

    // Use provided date range or default to last 30 days
    const endDateObj = endDate ? new Date(endDate) : new Date();
    const startDateObj = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Create or use existing session
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      currentSessionId = await createSession(brandId);
    }

    // Get brand context
    const brandContext = await getBrandContext(brandId, {
      startDate: startDateObj,
      endDate: endDateObj,
    });

    // Get conversation history
    const conversationHistory = await getConversationHistory(brandId, currentSessionId);

    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return res.status(400).json({ success: false, error: 'Invalid date format' });
    }

    // Fetch relevant analytics data
    const analyticsData: any = {};

    // Always fetch revenue, orders, and customers
    try {
      const revenue = await getTimeSeriesData(brandId, 'revenue', startDateObj, endDateObj, 'day');
      analyticsData.revenue = {
        total: revenue.summary.total,
        average: revenue.summary.average,
        growth: revenue.summary.growth,
      };
    } catch (error) {
      console.warn('Error fetching revenue data:', error);
    }

    try {
      const orders = await getTimeSeriesData(brandId, 'orders', startDateObj, endDateObj, 'day');
      analyticsData.orders = {
        total: orders.summary.total,
        avgOrderValue: orders.summary.average,
      };
    } catch (error) {
      console.warn('Error fetching orders data:', error);
    }

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

    // Always fetch segment analytics for better context
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

    // Add brand context to analytics data
    if (brandContext) {
      analyticsData.brandContext = brandContext;
      analyticsData.dateRange = {
        startDate: startDateObj.toISOString().split('T')[0],
        endDate: endDateObj.toISOString().split('T')[0],
      };
    }

    // Save user message to conversation
    await addMessage(brandId, currentSessionId, {
      type: 'user',
      content: question.trim(),
      timestamp: new Date(),
    });

    // Answer the question with conversation context
    const result = await answerQuery(
      brandId,
      question.trim(),
      { startDate: startDateObj, endDate: endDateObj },
      analyticsData,
      {
        sessionId: currentSessionId,
        conversationHistory,
      }
    );

    // Save assistant response to conversation
    await addMessage(brandId, currentSessionId, {
      type: 'assistant',
      content: result.answer,
      sources: result.sources,
      confidence: result.confidence,
      timestamp: new Date(),
    });

    res.json({
      success: true,
      data: {
        ...result,
        sessionId: currentSessionId,
      },
    });
  } catch (error: any) {
    console.error('Error answering question:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to answer question',
    });
  }
});

export default router;

