// GENERATOR: ONBOARDING_SYSTEM
// Onboarding routes for multi-step wizard
// HOW TO USE: Mount at /api/onboarding with auth middleware

import { Router, Response } from 'express';
import {
  authenticate,
  AuthenticatedRequest,
  requireBrandAccess,
} from '../middleware/auth';
import {
  getOnboardingState,
  updateOnboardingStep,
  completeOnboarding,
  getOnboardingProgress,
} from '../services/onboarding/onboardingService';
import { z } from 'zod';

const router = Router();

// All routes require authentication
router.use(authenticate);
router.use(requireBrandAccess);

/**
 * GET /api/onboarding/state
 * Get current onboarding state
 */
router.get('/state', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.brandId) {
      res.status(403).json({
        success: false,
        error: 'Brand access required',
      });
      return;
    }

    const state = await getOnboardingState(req.user.brandId);
    const progress = await getOnboardingProgress(req.user.brandId);

    res.json({
      success: true,
      data: {
        state,
        progress,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get onboarding state',
    });
  }
});

/**
 * POST /api/onboarding/step/:step
 * Update a specific onboarding step
 */
router.post('/step/:step', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.brandId) {
      res.status(403).json({
        success: false,
        error: 'Brand access required',
      });
      return;
    }

    const step = parseInt(req.params.step, 10);
    
    if (isNaN(step) || step < 1 || step > 5) {
      res.status(400).json({
        success: false,
        error: 'Invalid step number',
      });
      return;
    }

    // Step-specific validation
    const schemas: Record<number, z.ZodSchema<any>> = {
      1: z.object({
        brandInfo: z.object({
          name: z.string().min(1),
          domain: z.string().optional(),
          industry: z.string().optional(),
          companySize: z.string().optional(),
          description: z.string().optional(),
        }).or(z.object({
          name: z.string().min(1),
          domain: z.string().optional(),
          industry: z.string().optional(),
          companySize: z.string().optional(),
          description: z.string().optional(),
        })),
      }).or(z.object({
        name: z.string().min(1),
        domain: z.string().optional(),
        industry: z.string().optional(),
        companySize: z.string().optional(),
        description: z.string().optional(),
      })),
      2: z.object({
        contactDetails: z.object({
          contactPerson: z.string().min(1),
          contactEmail: z.string().email(),
          phone: z.string().optional(),
          billingAddress: z.string().optional(),
        }).or(z.object({
          contactPerson: z.string().min(1),
          contactEmail: z.string().email(),
          phone: z.string().optional(),
          billingAddress: z.string().optional(),
        })),
      }).or(z.object({
        contactPerson: z.string().min(1),
        contactEmail: z.string().email(),
        phone: z.string().optional(),
        billingAddress: z.string().optional(),
      })),
      3: z.object({
        integrations: z.object({
          shopify: z.object({ enabled: z.boolean().optional() }).optional(),
          woocommerce: z.object({ enabled: z.boolean().optional() }).optional(),
          twilio: z.object({ enabled: z.boolean().optional() }).optional(),
        }).optional(),
      }).optional(),
      4: z.object({
        configuration: z.object({
          timezone: z.string().min(1),
          currency: z.string().min(1),
          preferences: z.record(z.any()).optional(),
        }).or(z.object({
          timezone: z.string().min(1),
          currency: z.string().min(1),
          preferences: z.record(z.any()).optional(),
        })),
      }).or(z.object({
        timezone: z.string().min(1),
        currency: z.string().min(1),
        preferences: z.record(z.any()).optional(),
      })),
      5: z.any(), // Review step doesn't add new data
    };

    const schema = schemas[step];
    if (schema) {
      schema.parse(req.body);
    }

    const state = await updateOnboardingStep(req.user.brandId, step, req.body);
    const progress = await getOnboardingProgress(req.user.brandId);

    res.json({
      success: true,
      data: {
        state,
        progress,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update onboarding step',
    });
  }
});

/**
 * POST /api/onboarding/complete
 * Complete onboarding process
 */
router.post('/complete', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.brandId) {
      res.status(403).json({
        success: false,
        error: 'Brand access required',
      });
      return;
    }

    await completeOnboarding(req.user.brandId);

    res.json({
      success: true,
      message: 'Onboarding completed successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to complete onboarding',
    });
  }
});

export default router;

