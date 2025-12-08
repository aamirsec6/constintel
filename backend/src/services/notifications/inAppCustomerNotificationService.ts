// GENERATOR: CUSTOMER_NOTIFICATIONS
// In-app customer notification service
// HOW TO RUN: Import and use to create in-app notifications

import { getPrismaClient } from '../../db/prismaClient';

export interface CreateNotificationParams {
  userId: string;
  brandId: string;
  type: string;
  title: string;
  message: string;
  metadata?: any;
}

/**
 * Create in-app notification
 */
export async function createInAppNotification(
  params: CreateNotificationParams
): Promise<string> {
  const prisma = await getPrismaClient();
  
  const notification = await prisma.notification.create({
    data: {
      userId: params.userId,
      brandId: params.brandId,
      type: params.type,
      title: params.title,
      message: params.message,
      metadata: params.metadata || {},
      read: false
    }
  });
  
  return notification.id;
}

/**
 * Get user notifications
 */
export async function getUserNotifications(
  userId: string,
  brandId?: string,
  limit: number = 50
): Promise<any[]> {
  const prisma = await getPrismaClient();
  
  const where: any = { userId };
  if (brandId) {
    where.brandId = brandId;
  }
  
  return await prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit
  });
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(notificationId: string): Promise<void> {
  const prisma = await getPrismaClient();
  
  await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true, readAt: new Date() }
  });
}

/**
 * Mark all notifications as read for user
 */
export async function markAllNotificationsRead(userId: string, brandId?: string): Promise<void> {
  const prisma = await getPrismaClient();
  
  const where: any = { userId, read: false };
  if (brandId) {
    where.brandId = brandId;
  }
  
  await prisma.notification.updateMany({
    where,
    data: { read: true, readAt: new Date() }
  });
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userId: string, brandId?: string): Promise<number> {
  const prisma = await getPrismaClient();
  
  const where: any = { userId, read: false };
  if (brandId) {
    where.brandId = brandId;
  }
  
  return await prisma.notification.count({ where });
}

