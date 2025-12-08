// GENERATOR: CUSTOMER_NOTIFICATIONS
// Webhook customer notification service
// HOW TO RUN: Import and use to send webhook notifications

import axios from 'axios';
import { getPrismaClient } from '../../db/prismaClient';
import { Digest } from './digestAggregationService';

/**
 * Send webhook digest notification
 */
export async function sendWebhookDigest(brandId: string, digest: Digest): Promise<void> {
  const prisma = await getPrismaClient();
  
  // Get webhook configurations for brand
  const webhooks = await prisma.webhookConfiguration.findMany({
    where: {
      brandId,
      enabled: true,
      eventTypes: {
        array_contains: ['customer_activity']
      }
    }
  });
  
  const payload = {
    event: 'customer_digest',
    period: digest.period.split(' ')[0],
    brand_id: brandId,
    instance_id: digest.instanceId,
    summary: digest.summary,
    events: digest.events,
    timestamp: new Date().toISOString()
  };
  
  // Send to all configured webhooks
  for (const webhook of webhooks) {
    try {
      await axios.post(webhook.url, payload, {
        headers: {
          'Content-Type': 'application/json',
          ...(webhook.secret && {
            'X-Webhook-Signature': generateSignature(JSON.stringify(payload), webhook.secret)
          })
        },
        timeout: 10000 // 10 second timeout
      });
    } catch (error: any) {
      console.error(`Error sending webhook to ${webhook.url}:`, error.message);
      // Log failed webhook delivery (could implement retry logic)
      await logWebhookDelivery(webhook.id, false, error.message);
    }
  }
}

function generateSignature(payload: string, secret: string): string {
  const crypto = require('crypto');
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

async function logWebhookDelivery(
  webhookId: string,
  success: boolean,
  error?: string
): Promise<void> {
  // Could implement webhook delivery logging table
  console.log(`Webhook ${webhookId}: ${success ? 'delivered' : 'failed'} - ${error || ''}`);
}

