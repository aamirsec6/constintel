// GENERATOR: CUSTOMER_NOTIFICATIONS
// Customer notification API endpoints
// HOW TO RUN: app.use('/api/customer-notifications', customerNotificationsRouter)

import { Router, Request, Response } from 'express';
import { 
  getAllEventTypeConfigs, 
  updateEventTypeConfig, 
  getEventTypeConfig 
} from '../services/notifications/eventTypeConfigService';
import {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadCount
} from '../services/notifications/inAppCustomerNotificationService';
import { sendCustomerDigests } from '../services/notifications/customerActivityNotificationService';
import { getPrismaClient } from '../db/prismaClient';

const router = Router();

/**
 * GET /api/customer-notifications/config
 * Get event type configuration for brand
 */
router.get('/config', async (req: Request, res: Response) => {
  try {
    const brandId = req.headers['x-brand-id'] as string || req.query.brandId as string;
    if (!brandId) {
      return res.status(400).json({ error: 'brandId required' });
    }
    
    const configs = await getAllEventTypeConfigs(brandId);
    res.json({ success: true, data: configs });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/customer-notifications/config
 * Update event type configuration
 */
router.put('/config', async (req: Request, res: Response) => {
  try {
    const brandId = req.headers['x-brand-id'] as string || req.body.brandId;
    const { eventType, enabled, importance, digestFrequency } = req.body;
    
    if (!brandId || !eventType) {
      return res.status(400).json({ error: 'brandId and eventType required' });
    }
    
    const config = await updateEventTypeConfig(brandId, eventType, {
      enabled,
      importance,
      digestFrequency
    });
    
    res.json({ success: true, data: config });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/customer-notifications/digests
 * Get digest history
 */
router.get('/digests', async (req: Request, res: Response) => {
  try {
    const brandId = req.headers['x-brand-id'] as string || req.query.brandId as string;
    const limit = parseInt(req.query.limit as string) || 20;
    
    if (!brandId) {
      return res.status(400).json({ error: 'brandId required' });
    }
    
    const prisma = await getPrismaClient();
    const digests = await prisma.customerEventDigest.findMany({
      where: { brandId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
    
    res.json({ success: true, data: digests });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/customer-notifications/digests/:id
 * Get specific digest
 */
router.get('/digests/:id', async (req: Request, res: Response) => {
  try {
    const prisma = await getPrismaClient();
    const digest = await prisma.customerEventDigest.findUnique({
      where: { id: req.params.id }
    });
    
    if (!digest) {
      return res.status(404).json({ error: 'Digest not found' });
    }
    
    res.json({ success: true, data: digest });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/customer-notifications
 * Get user's notifications
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string || req.query.userId as string;
    const brandId = req.query.brandId as string;
    const limit = parseInt(req.query.limit as string) || 50;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }
    
    const notifications = await getUserNotifications(userId, brandId, limit);
    res.json({ success: true, data: notifications });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/customer-notifications/:id/read
 * Mark notification as read
 */
router.put('/:id/read', async (req: Request, res: Response) => {
  try {
    await markNotificationRead(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/customer-notifications/read-all
 * Mark all notifications as read
 */
router.put('/read-all', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string || req.body.userId;
    const brandId = req.body.brandId;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }
    
    await markAllNotificationsRead(userId, brandId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/customer-notifications/unread-count
 * Get unread notification count
 */
router.get('/unread-count', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string || req.query.userId as string;
    const brandId = req.query.brandId as string;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }
    
    const count = await getUnreadCount(userId, brandId);
    res.json({ success: true, count });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/customer-notifications/test
 * Send test notification (admin only)
 */
router.post('/test', async (req: Request, res: Response) => {
  try {
    const brandId = req.headers['x-brand-id'] as string || req.body.brandId;
    const period = req.body.period || 'hourly';
    
    if (!brandId) {
      return res.status(400).json({ error: 'brandId required' });
    }
    
    const prisma = await getPrismaClient();
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
      select: { instanceId: true }
    });
    
    await sendCustomerDigests(brandId, brand?.instanceId || brandId, period);
    res.json({ success: true, message: 'Test notification sent' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

