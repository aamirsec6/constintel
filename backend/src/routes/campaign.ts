// GENERATOR: OMNICHANNEL_PLATFORM
// ASSUMPTIONS: Express app, campaign service available
// HOW TO RUN: app.use('/api/campaign', campaignRouter)

import { Router, Request, Response } from 'express';
import { createCampaign, executeCampaign, getCampaignPerformance, getCampaigns } from '../services/campaign/campaignService';
import { z } from 'zod';

const router = Router();

const CreateCampaignSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  campaign_type: z.enum(['one_time', 'recurring', 'triggered']),
  schedule: z.object({
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    frequency: z.enum(['once', 'daily', 'weekly', 'monthly']).optional(),
    time_of_day: z.string().optional(),
  }).optional(),
  target_segment: z.object({
    segment: z.string().optional(),
    rfm: z.object({
      recency: z.object({ min: z.number().optional(), max: z.number().optional() }).optional(),
      frequency: z.object({ min: z.number().optional(), max: z.number().optional() }).optional(),
      monetary: z.object({ min: z.number().optional(), max: z.number().optional() }).optional(),
    }).optional(),
    custom: z.array(z.any()).optional(),
  }).optional(),
  target_channels: z.array(z.enum(['whatsapp', 'email', 'sms', 'push'])),
  message_template: z.object({
    subject: z.string().optional(),
    body: z.string().min(1),
    personalization_fields: z.array(z.string()).optional(),
  }),
  personalization: z.object({
    product_recommendations: z.boolean().optional(),
    dynamic_offers: z.boolean().optional(),
  }).optional(),
  ab_test_enabled: z.boolean().optional(),
  ab_test_variants: z.array(z.any()).optional(),
  duplicate_prevention: z.boolean().optional(),
  exclusion_rules: z.object({
    exclude_recent_purchasers: z.boolean().optional(),
    exclude_segments: z.array(z.string()).optional(),
  }).optional(),
});

/**
 * POST /api/campaign
 * Create campaign
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const brandId = req.headers['x-brand-id'] as string || req.body.brand_id;
    if (!brandId) {
      return res.status(400).json({
        success: false,
        error: 'brand_id is required',
      });
    }

    const validated = CreateCampaignSchema.parse(req.body);

    const campaignId = await createCampaign({
      brandId,
      name: validated.name,
      description: validated.description,
      campaignType: validated.campaign_type,
      schedule: validated.schedule,
      targetSegment: validated.target_segment,
      targetChannels: validated.target_channels,
      messageTemplate: validated.message_template,
      personalization: validated.personalization,
      abTestEnabled: validated.ab_test_enabled,
      abTestVariants: validated.ab_test_variants,
      duplicatePrevention: validated.duplicate_prevention,
      exclusionRules: validated.exclusion_rules,
    });

    res.status(201).json({
      success: true,
      data: { id: campaignId },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Error creating campaign:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/campaign
 * List campaigns
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

    const status = req.query.status as string | undefined;
    const campaigns = await getCampaigns(brandId, status);

    res.json({
      success: true,
      data: campaigns,
      count: campaigns.length,
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/campaign/:id/execute
 * Execute campaign
 */
router.post('/:id/execute', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await executeCampaign(id);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error executing campaign:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

/**
 * GET /api/campaign/:id/performance
 * Get campaign performance metrics
 */
router.get('/:id/performance', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const performance = await getCampaignPerformance(id);

    res.json({
      success: true,
      data: performance,
    });
  } catch (error: any) {
    console.error('Error fetching campaign performance:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

export default router;

