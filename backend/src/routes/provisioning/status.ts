// GENERATOR: ONBOARDING_SYSTEM
// Provisioning status routes
// HOW TO USE: Mount at /api/provisioning/status with auth middleware

import { Router, Response } from 'express';
import {
  authenticate,
  AuthenticatedRequest,
  requireBrandAccess,
} from '../../middleware/auth';
import { getProvisioningStatus } from '../../services/infrastructure/provisioningStatus';
import { getPrismaClient } from '../../db/prismaClient';

const router = Router();

// All routes require authentication
router.use(authenticate);
router.use(requireBrandAccess);

/**
 * GET /api/provisioning/status
 * Get provisioning status for authenticated brand
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.brandId) {
      res.status(403).json({
        success: false,
        error: 'Brand access required',
      });
      return;
    }

    const status = await getProvisioningStatus(req.user.brandId);

    if (!status) {
      res.json({
        success: true,
        data: null,
        message: 'No provisioning in progress',
      });
      return;
    }

    let responseData: any = status;
    if (status.status === 'completed') {
      const prisma = getPrismaClient();
      const brand = await prisma.brand.findUnique({
        where: { id: req.user.brandId },
        select: {
          apiKey: true,
          instanceId: true,
        },
      });
      responseData = {
        ...status,
        apiKey: brand?.apiKey,
        instanceId: brand?.instanceId,
      };
    }

    res.json({
      success: true,
      data: responseData,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get provisioning status',
    });
  }
});

export default router;

