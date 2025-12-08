// GENERATOR: CUSTOMER_NOTIFICATIONS
// Customer activity notification service
// HOW TO RUN: Import and use to track and send customer activity notifications

import { getPrismaClient } from '../../db/prismaClient';
import { trackNewCustomer, trackCustomerEvent } from './eventTrackingService';
import { generateDigest } from './digestAggregationService';
import { sendEmailDigest } from './emailDigestService';
import { createInAppNotification } from './inAppCustomerNotificationService';
import { sendWebhookDigest } from './webhookCustomerService';
import { getEventTypeConfig } from './eventTypeConfigService';

/**
 * Track new customer and trigger notification if configured
 */
export async function notifyNewCustomer(
  brandId: string,
  instanceId: string,
  profileId: string,
  customerData?: any
): Promise<void> {
  try {
    // Track the event
    await trackNewCustomer(brandId, instanceId, profileId, customerData);
    
    // Check if notifications are enabled for this event type
    const config = await getEventTypeConfig(brandId, 'new_customer');
    if (!config?.enabled) {
      return;
    }
    
    // For real-time events, send immediate notification (if configured)
    // Otherwise, events are aggregated into digests
    // This will be handled by the digest scheduler
  } catch (error) {
    console.error('Error notifying new customer:', error);
  }
}

/**
 * Track customer event and trigger notification if configured
 */
export async function notifyCustomerEvent(
  brandId: string,
  instanceId: string,
  profileId: string,
  eventType: string,
  eventData?: any
): Promise<void> {
  try {
    // Check if this event type should trigger notifications
    const config = await getEventTypeConfig(brandId, eventType);
    if (!config?.enabled) {
      return;
    }
    
    // Track the event
    await trackCustomerEvent(brandId, instanceId, profileId, eventType, eventData);
    
    // For important events, might send immediate notification
    // Otherwise, events are aggregated into digests
  } catch (error) {
    console.error('Error notifying customer event:', error);
  }
}

/**
 * Send digest notifications for a brand/instance
 */
export async function sendCustomerDigests(
  brandId: string,
  instanceId: string,
  period: 'hourly' | 'daily'
): Promise<void> {
  try {
    // Generate digest for the period
    const digest = await generateDigest(brandId, instanceId, period);
    
    if (!digest || digest.summary.total_events === 0) {
      return; // No events to notify about
    }
    
    // Get all users in the brand/instance
    const prisma = await getPrismaClient();
    const users = await prisma.user.findMany({
      where: {
        brandId: brandId
      },
      select: {
        id: true,
        email: true
      }
    });
    
    // Send notifications via all channels
    for (const user of users) {
      // Email notification
      if (user.email) {
        await sendEmailDigest(user.email, digest);
      }
      
      // In-app notification
      await createInAppNotification({
        userId: user.id,
        brandId: brandId,
        type: 'customer_digest',
        title: `${period === 'hourly' ? 'Hourly' : 'Daily'} Customer Activity Summary`,
        message: `You have ${digest.summary.new_customers} new customers and ${digest.summary.total_events} events`,
        metadata: digest
      });
    }
    
    // Send webhook notifications
    await sendWebhookDigest(brandId, digest);
    
    // Mark digest as sent
    await markDigestAsSent(digest.id);
  } catch (error) {
    console.error('Error sending customer digests:', error);
    throw error;
  }
}

async function markDigestAsSent(digestId: string): Promise<void> {
  const prisma = await getPrismaClient();
  await prisma.customerEventDigest.update({
    where: { id: digestId },
    data: { sentAt: new Date() }
  });
}

