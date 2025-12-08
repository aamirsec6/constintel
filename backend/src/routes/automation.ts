// GENERATOR: OMNICHANNEL_PLATFORM
// ASSUMPTIONS: Express app, automation service available
// HOW TO RUN: app.use('/api/automation', automationRouter)

import { Router, Request, Response } from 'express';
import { createAutomation, getAutomations, executeAutomation, getAutomationExecutions } from '../services/automation/automationService';
import { z } from 'zod';

const router = Router();

const CreateAutomationSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  trigger: z.object({
    type: z.enum(['churn_risk', 'cart_abandonment', 'product_intent', 'ltv_milestone', 're_engagement', 'store_visit', 'custom']),
    threshold: z.number().optional(),
    event_type: z.string().optional(),
    time_window: z.number().optional(),
  }),
  conditions: z.object({
    segment: z.string().optional(),
    channel: z.string().optional(),
    product_category: z.string().optional(),
    min_ltv: z.number().optional(),
    max_ltv: z.number().optional(),
  }).optional(),
  actions: z.array(z.object({
    type: z.enum(['send_message', 'send_email', 'send_sms', 'send_push', 'update_segment', 'create_task']),
    channel: z.enum(['whatsapp', 'email', 'sms', 'push']).optional(),
    template: z.string().optional(),
    message: z.string().optional(),
    subject: z.string().optional(),
    delay_minutes: z.number().optional(),
  })),
  enabled: z.boolean().optional(),
  priority: z.number().optional(),
  ab_test_enabled: z.boolean().optional(),
  ab_test_variants: z.array(z.any()).optional(),
});

/**
 * POST /api/automation
 * Create automation rule
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

    const validated = CreateAutomationSchema.parse(req.body);

    const automationId = await createAutomation({
      brandId,
      name: validated.name,
      description: validated.description,
      trigger: validated.trigger,
      conditions: validated.conditions,
      actions: validated.actions,
      enabled: validated.enabled,
      priority: validated.priority,
      abTestEnabled: validated.ab_test_enabled,
      abTestVariants: validated.ab_test_variants,
    });

    res.status(201).json({
      success: true,
      data: { id: automationId },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Error creating automation:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/automation
 * List all automations
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

    const enabled = req.query.enabled === 'true' ? true : req.query.enabled === 'false' ? false : undefined;
    const automations = await getAutomations(brandId, enabled);

    res.json({
      success: true,
      data: automations,
      count: automations.length,
    });
  } catch (error) {
    console.error('Error fetching automations:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/automation/:id/trigger
 * Manually trigger automation for a profile
 */
router.post('/:id/trigger', async (req: Request, res: Response) => {
  try {
    const brandId = req.headers['x-brand-id'] as string;
    const { id } = req.params;
    const { profile_id, trigger_reason } = req.body;

    if (!brandId || !profile_id) {
      return res.status(400).json({
        success: false,
        error: 'brand_id and profile_id are required',
      });
    }

    const executionId = await executeAutomation(id, profile_id, trigger_reason);

    res.json({
      success: true,
      data: { execution_id: executionId },
    });
  } catch (error: any) {
    console.error('Error triggering automation:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

/**
 * GET /api/automation/:id/executions
 * Get automation execution history
 */
router.get('/:id/executions', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    const executions = await getAutomationExecutions(id, limit);

    res.json({
      success: true,
      data: executions,
      count: executions.length,
    });
  } catch (error) {
    console.error('Error fetching automation executions:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;

