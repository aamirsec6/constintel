// GENERATOR: ONBOARDING_SYSTEM
// Notification routes
// HOW TO USE: Mount at /api/notifications with auth middleware

import { Router, Response } from 'express';
import {
  authenticate,
  AuthenticatedRequest,
} from '../middleware/auth';
import {
  getNotifications,
  markNotificationAsRead,
  markAllAsRead,
} from '../services/notifications/notificationService';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/notifications
 * Get notifications for authenticated user
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const unreadOnly = req.query.unread === 'true';
    
    const notifications = await getNotifications(
      req.user?.userId,
      req.user?.brandId,
      unreadOnly
    );

    res.json({
      success: true,
      data: notifications,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get notifications',
    });
  }
});

/**
 * POST /api/notifications/:id/read
 * Mark notification as read
 */
router.post('/:id/read', async (req: AuthenticatedRequest, res: Response) => {
  try {
    await markNotificationAsRead(req.params.id);

    res.json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to mark notification as read',
    });
  }
});

/**
 * POST /api/notifications/read-all
 * Mark all notifications as read
 */
router.post('/read-all', async (req: AuthenticatedRequest, res: Response) => {
  try {
    await markAllAsRead(req.user?.userId, req.user?.brandId);

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to mark all notifications as read',
    });
  }
});

export default router;

