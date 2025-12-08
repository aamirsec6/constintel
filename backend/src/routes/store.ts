// GENERATOR: OMNICHANNEL_PLATFORM
// ASSUMPTIONS: Express app, store visit service, alert service available
// HOW TO RUN: app.use('/api/store', storeRouter)

import { Router, Request, Response } from 'express';
import { detectStoreVisit, completeStoreVisit, getActiveVisits, getRecentVisits, getCustomerVisits } from '../services/store/storeVisitService';
import { getActiveAlerts, markAlertAsViewed, markAlertAsDelivered } from '../services/alerts/inStoreAlertService';
import { getStoreDashboard, lookupCustomer, getCustomerRecommendations } from '../services/store/storeDashboardService';
import { getPlanogramInsights } from '../services/planogram/planogramService';
import { z } from 'zod';

const router = Router();

const StoreVisitSchema = z.object({
  store_id: z.string().min(1),
  store_name: z.string().optional(),
  detection_method: z.enum(['geofence', 'qr_scan', 'pos_lookup', 'checkin', 'wifi']),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
    accuracy: z.number().optional(),
  }).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  loyalty_id: z.string().optional(),
  device_id: z.string().optional(),
  qr_code: z.string().optional(),
  mac_address: z.string().optional(),
});

/**
 * POST /api/store/visit
 * Record a store visit
 */
router.post('/visit', async (req: Request, res: Response) => {
  try {
    const brandId = req.headers['x-brand-id'] as string || req.body.brand_id;
    if (!brandId) {
      return res.status(400).json({
        success: false,
        error: 'brand_id is required',
      });
    }

    const validated = StoreVisitSchema.parse(req.body);

    const result = await detectStoreVisit({
      brandId,
      storeId: validated.store_id,
      storeName: validated.store_name,
      detectionMethod: validated.detection_method,
      location: validated.location,
      phone: validated.phone,
      email: validated.email,
      loyaltyId: validated.loyalty_id,
      deviceId: validated.device_id,
      qrCode: validated.qr_code,
      macAddress: validated.mac_address,
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

    console.error('Error detecting store visit:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * PATCH /api/store/visit/:visitId/complete
 * Complete a store visit (checkout)
 */
router.patch('/visit/:visitId/complete', async (req: Request, res: Response) => {
  try {
    const brandId = req.headers['x-brand-id'] as string;
    if (!brandId) {
      return res.status(400).json({
        success: false,
        error: 'x-brand-id header is required',
      });
    }

    const { visitId } = req.params;
    await completeStoreVisit(brandId, visitId);

    res.json({
      success: true,
      message: 'Visit completed',
    });
  } catch (error: any) {
    console.error('Error completing store visit:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

/**
 * GET /api/stores/:storeId/alerts/active
 * Get active alerts for a store
 */
router.get('/stores/:storeId/alerts/active', async (req: Request, res: Response) => {
  try {
    const brandId = req.headers['x-brand-id'] as string;
    if (!brandId) {
      return res.status(400).json({
        success: false,
        error: 'x-brand-id header is required',
      });
    }

    const { storeId } = req.params;
    const alerts = await getActiveAlerts(brandId, storeId);

    res.json({
      success: true,
      data: alerts,
      count: alerts.length,
    });
  } catch (error) {
    console.error('Error fetching active alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * PATCH /api/alerts/:alertId/viewed
 * Mark alert as viewed by store staff
 */
router.patch('/alerts/:alertId/viewed', async (req: Request, res: Response) => {
  try {
    const { alertId } = req.params;
    await markAlertAsViewed(alertId);

    res.json({
      success: true,
      message: 'Alert marked as viewed',
    });
  } catch (error) {
    console.error('Error marking alert as viewed:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * PATCH /api/alerts/:alertId/delivered
 * Mark alert as delivered
 */
router.patch('/alerts/:alertId/delivered', async (req: Request, res: Response) => {
  try {
    const { alertId } = req.params;
    await markAlertAsDelivered(alertId);

    res.json({
      success: true,
      message: 'Alert marked as delivered',
    });
  } catch (error) {
    console.error('Error marking alert as delivered:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/stores/:storeId/visits
 * Get recent visits for a store
 */
router.get('/stores/:storeId/visits', async (req: Request, res: Response) => {
  try {
    const brandId = req.headers['x-brand-id'] as string;
    if (!brandId) {
      return res.status(400).json({
        success: false,
        error: 'x-brand-id header is required',
      });
    }

    const { storeId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const active = req.query.active === 'true';

    const visits = active
      ? await getActiveVisits(brandId, storeId)
      : await getRecentVisits(brandId, storeId, limit);

    res.json({
      success: true,
      data: visits,
      count: visits.length,
    });
  } catch (error) {
    console.error('Error fetching store visits:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/profiles/:profileId/visits
 * Get visits for a customer profile
 */
router.get('/profiles/:profileId/visits', async (req: Request, res: Response) => {
  try {
    const brandId = req.headers['x-brand-id'] as string;
    if (!brandId) {
      return res.status(400).json({
        success: false,
        error: 'x-brand-id header is required',
      });
    }

    const { profileId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

    const visits = await getCustomerVisits(brandId, profileId, limit);

    res.json({
      success: true,
      data: visits,
      count: visits.length,
    });
  } catch (error) {
    console.error('Error fetching customer visits:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/store/dashboard/:storeId
 * Get store dashboard data
 */
router.get('/dashboard/:storeId', async (req: Request, res: Response) => {
  try {
    const brandId = req.headers['x-brand-id'] as string;
    const { storeId } = req.params;

    if (!brandId) {
      return res.status(400).json({
        success: false,
        error: 'x-brand-id header is required',
      });
    }

    const dashboard = await getStoreDashboard(brandId, storeId);

    res.json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    console.error('Error fetching store dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/store/lookup/:storeId
 * Lookup customer by identifier
 */
router.get('/lookup/:storeId', async (req: Request, res: Response) => {
  try {
    const brandId = req.headers['x-brand-id'] as string;
    const { storeId } = req.params;
    const identifier = req.query.identifier as string;

    if (!brandId) {
      return res.status(400).json({
        success: false,
        error: 'x-brand-id header is required',
      });
    }

    if (!identifier) {
      return res.status(400).json({
        success: false,
        error: 'identifier query parameter is required',
      });
    }

    const customer = await lookupCustomer(brandId, storeId, identifier);

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found',
      });
    }

    res.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error('Error looking up customer:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/store/recommendations/:profileId
 * Get product recommendations for customer
 */
router.get('/recommendations/:profileId', async (req: Request, res: Response) => {
  try {
    const brandId = req.headers['x-brand-id'] as string;
    const { profileId } = req.params;

    if (!brandId) {
      return res.status(400).json({
        success: false,
        error: 'x-brand-id header is required',
      });
    }

    const recommendations = await getCustomerRecommendations(brandId, profileId);

    res.json({
      success: true,
      data: recommendations,
    });
  } catch (error: any) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

/**
 * GET /api/store/planogram
 * Get planogram insights and recommendations
 */
router.get('/planogram', async (req: Request, res: Response) => {
  try {
    const brandId = req.headers['x-brand-id'] as string;
    if (!brandId) {
      return res.status(400).json({
        success: false,
        error: 'x-brand-id header is required',
      });
    }

    const storeId = req.query.storeId as string | undefined;
    const category = req.query.category as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    const priority = req.query.priority as 'high' | 'medium' | 'low' | undefined;

    const insights = await getPlanogramInsights(brandId, {
      storeId,
      category,
      limit,
      offset,
      priority,
    });

    res.json({
      success: true,
      data: insights,
    });
  } catch (error: any) {
    console.error('Error fetching planogram insights:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

export default router;

