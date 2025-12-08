// GENERATOR: OMNICHANNEL_PLATFORM
// ASSUMPTIONS: Express app, product intent service available
// HOW TO RUN: app.use('/api/intent', intentRouter)

import { Router, Request, Response } from 'express';
import { trackProductIntent, getActiveIntents, getHighIntentProducts, markIntentAsConverted } from '../services/intent/productIntentService';
import { z } from 'zod';

const router = Router();

const TrackIntentSchema = z.object({
  profile_id: z.string().min(1),
  product_id: z.string().min(1),
  product_name: z.string().optional(),
  category: z.string().optional(),
  intent_type: z.enum(['product_view', 'product_search', 'cart_add', 'wishlist_add', 'product_click']),
  source_channel: z.enum(['web', 'mobile_app', 'whatsapp']).optional(),
  session_id: z.string().optional(),
  page_url: z.string().optional(),
  search_query: z.string().optional(),
  view_duration: z.number().optional(),
});

/**
 * POST /api/intent
 * Track or update product intent
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

    const validated = TrackIntentSchema.parse(req.body);

    const result = await trackProductIntent({
      brandId,
      profileId: validated.profile_id,
      productId: validated.product_id,
      productName: validated.product_name,
      category: validated.category,
      intentType: validated.intent_type,
      sourceChannel: validated.source_channel,
      sessionId: validated.session_id,
      pageUrl: validated.page_url,
      searchQuery: validated.search_query,
      viewDuration: validated.view_duration,
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Error tracking product intent:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/profiles/:profileId/intents
 * Get active product intents for a customer
 */
router.get('/profiles/:profileId/intents', async (req: Request, res: Response) => {
  try {
    const brandId = req.headers['x-brand-id'] as string;
    const { profileId } = req.params;
    const minScore = req.query.min_score ? parseFloat(req.query.min_score as string) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const sortBy = req.query.sort_by as 'score' | 'recent' | undefined;

    if (!brandId) {
      return res.status(400).json({
        success: false,
        error: 'x-brand-id header is required',
      });
    }

    const intents = await getActiveIntents(brandId, profileId, {
      minScore,
      limit,
      sortBy,
    });

    res.json({
      success: true,
      data: intents,
      count: intents.length,
    });
  } catch (error) {
    console.error('Error fetching product intents:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/profiles/:profileId/intents/high-intent
 * Get high-intent products (score >= 50)
 */
router.get('/profiles/:profileId/intents/high-intent', async (req: Request, res: Response) => {
  try {
    const brandId = req.headers['x-brand-id'] as string;
    const { profileId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;

    if (!brandId) {
      return res.status(400).json({
        success: false,
        error: 'x-brand-id header is required',
      });
    }

    const intents = await getHighIntentProducts(brandId, profileId, limit);

    res.json({
      success: true,
      data: intents,
      count: intents.length,
    });
  } catch (error) {
    console.error('Error fetching high-intent products:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/intent/:intentId
 * Get intent details
 */
router.get('/:intentId', async (req: Request, res: Response) => {
  try {
    const { intentId } = req.params;
    const { getPrismaClient } = require('../db/prismaClient');
    const prisma = getPrismaClient();

    const intent = await prisma.productIntent.findUnique({
      where: { id: intentId },
      include: {
        profile: {
          select: {
            id: true,
            identifiers: true,
            lifetimeValue: true,
            totalOrders: true,
          },
        },
      },
    });

    if (!intent) {
      return res.status(404).json({
        success: false,
        error: 'Intent not found',
      });
    }

    res.json({
      success: true,
      data: intent,
    });
  } catch (error) {
    console.error('Error fetching intent:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * PATCH /api/intent/:intentId/convert
 * Mark intent as converted (customer purchased)
 */
router.patch('/:intentId/convert', async (req: Request, res: Response) => {
  try {
    const brandId = req.headers['x-brand-id'] as string;
    const { intentId } = req.params;
    const { getPrismaClient } = require('../db/prismaClient');
    const prisma = getPrismaClient();

    if (!brandId) {
      return res.status(400).json({
        success: false,
        error: 'x-brand-id header is required',
      });
    }

    const intent = await prisma.productIntent.findUnique({
      where: { id: intentId },
    });

    if (!intent || intent.brandId !== brandId) {
      return res.status(404).json({
        success: false,
        error: 'Intent not found',
      });
    }

    await markIntentAsConverted(brandId, intent.profileId, intent.productId);

    res.json({
      success: true,
      message: 'Intent marked as converted',
    });
  } catch (error) {
    console.error('Error converting intent:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;

