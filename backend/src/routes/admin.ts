// GENERATOR: AUTH_SYSTEM
// Admin routes (admin only)
// HOW TO USE: Mount at /api/admin with requireAdmin middleware

import { Router, Response } from 'express';
import {
  authenticate,
  requireAdmin,
  AuthenticatedRequest,
} from '../middleware/auth';
import {
  getPlatformStats,
  adminListBrands,
  adminGetBrandDetails,
  suspendBrand,
  activateBrand,
} from '../services/admin/adminService';
import { z } from 'zod';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

/**
 * GET /api/admin/stats
 * Get platform statistics
 */
router.get('/stats', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = await getPlatformStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get platform stats',
    });
  }
});

/**
 * GET /api/admin/brands
 * List all brands with filters
 */
router.get('/brands', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const filters = {
      status: req.query.status as string | undefined,
      plan: req.query.plan as string | undefined,
      search: req.query.search as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string, 10) : undefined,
    };

    const result = await adminListBrands(filters);
    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to list brands',
    });
  }
});

/**
 * GET /api/admin/brands/:id
 * Get brand details
 */
router.get('/brands/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const brand = await adminGetBrandDetails(req.params.id);

    if (!brand) {
      res.status(404).json({
        success: false,
        error: 'Brand not found',
      });
      return;
    }

    res.json({
      success: true,
      data: brand,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get brand details',
    });
  }
});

/**
 * POST /api/admin/brands/:id/suspend
 * Suspend a brand
 */
router.post('/brands/:id/suspend', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reason } = req.body;
    await suspendBrand(req.params.id, reason);

    res.json({
      success: true,
      message: 'Brand suspended successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to suspend brand',
    });
  }
});

/**
 * POST /api/admin/brands/:id/activate
 * Activate a brand
 */
router.post('/brands/:id/activate', async (req: AuthenticatedRequest, res: Response) => {
  try {
    await activateBrand(req.params.id);

    res.json({
      success: true,
      message: 'Brand activated successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to activate brand',
    });
  }
});

export default router;

