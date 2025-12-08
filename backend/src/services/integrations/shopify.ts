// GENERATOR: INTEGRATIONS
// ASSUMPTIONS: Shopify webhook payload format, SHOPIFY_WEBHOOK_SECRET in env
// HOW TO RUN: Use via /api/integrations/shopify/webhook route
// DOCS: https://shopify.dev/docs/api/admin-rest/2024-01/resources/webhook

import crypto from 'crypto';
import { ingestEvent } from '../ingestion/eventIngestion';
import { trackProductIntent } from '../intent/productIntentService';
import { isOrderProcessed, markOrderProcessed } from '../redis/idempotency';

export interface ShopifyWebhookPayload {
  id?: number;
  email?: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  orders_count?: number;
  total_spent?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

/**
 * Verify Shopify webhook signature
 * Docs: https://shopify.dev/docs/apps/webhooks/configuration/https#step-5-verify-the-webhook
 */
export function verifyShopifyWebhook(
  body: string,
  signature: string,
  secret: string
): boolean {
  if (!signature || !secret) {
    return false;
  }

  const hmac = crypto.createHmac('sha256', secret);
  const hash = hmac.update(body, 'utf8').digest('base64');
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
}

/**
 * Transform Shopify webhook payload to our event format
 */
export function transformShopifyEvent(
  topic: string,
  payload: ShopifyWebhookPayload
): { eventType: string; normalizedPayload: any } {
  // Map Shopify topics to our event types
  const eventTypeMap: Record<string, string> = {
    'orders/create': 'purchase',
    'orders/updated': 'order_updated',
    'orders/paid': 'purchase',
    'orders/cancelled': 'order_cancelled',
    'customers/create': 'customer_created',
    'customers/update': 'customer_updated',
    'checkouts/create': 'checkout_started',
    'checkouts/update': 'checkout_updated',
    'products/create': 'product_created',
    'products/update': 'product_updated',
    // Custom events (from frontend tracking)
    'product/view': 'product_view',
    'product/search': 'product_search',
    'cart/add': 'cart_add',
    'cart/remove': 'cart_remove',
    'wishlist/add': 'wishlist_add',
  };

  const eventType = eventTypeMap[topic] || topic.replace('/', '_');

  // Normalize payload structure
  const normalizedPayload: any = {
    ...payload,
    // Extract identifiers
    email: payload.email || payload.contact_email,
    phone: payload.phone || payload.phone_number,
    // Extract order data if present
    total: payload.total_spent ? parseFloat(payload.total_spent) : undefined,
    order_id: payload.id?.toString(),
    // Extract product data for product events
    product_id: payload.product_id || payload.product?.id?.toString(),
    product_name: payload.product_name || payload.product?.title,
    category: payload.category || payload.product?.product_type,
    // Extract line items for orders
    items: payload.line_items || payload.items || [],
    // Extract search query
    search_query: payload.query || payload.search_query,
    // Extract session data
    session_id: payload.session_id,
    page_url: payload.page_url || payload.url,
    view_duration: payload.view_duration,
    // Preserve original Shopify data
    shopify_data: payload,
    source: 'shopify',
  };

  return { eventType, normalizedPayload };
}

/**
 * Process Shopify webhook
 */
export async function processShopifyWebhook(
  brandId: string,
  topic: string,
  payload: ShopifyWebhookPayload
): Promise<{ success: boolean; eventId?: string; profileId?: string }> {
  try {
    // Idempotency check for orders (prevent duplicate processing)
    if (topic === 'orders/create' || topic === 'orders/paid' || topic === 'orders/updated') {
      const orderId = payload.id?.toString() || '';
      const orderNumber = payload.order_number?.toString() || payload.number?.toString();
      
      if (orderId) {
        const alreadyProcessed = await isOrderProcessed(orderId, orderNumber);
        if (alreadyProcessed) {
          console.log(`[Shopify] Order ${orderId} already processed, skipping (idempotency)`);
          return {
            success: true,
            eventId: undefined,
            profileId: undefined,
          };
        }
      }
    }

    const { eventType, normalizedPayload } = transformShopifyEvent(topic, payload);

    const result = await ingestEvent({
      brandId,
      eventType,
      payload: normalizedPayload,
    });

    // Mark order as processed (idempotency)
    if (topic === 'orders/create' || topic === 'orders/paid' || topic === 'orders/updated') {
      const orderId = payload.id?.toString() || '';
      const orderNumber = payload.order_number?.toString() || payload.number?.toString();
      if (orderId) {
        await markOrderProcessed(orderId, orderNumber, {
          eventId: result.eventId,
          profileId: result.profileId,
          processedAt: new Date().toISOString(),
        });
      }
    }

    // Track product intent for product-related events
    if (result.profileId && normalizedPayload.product_id && 
        ['product_view', 'product_search', 'cart_add', 'wishlist_add'].includes(eventType)) {
      try {
        await trackProductIntent({
          brandId,
          profileId: result.profileId,
          productId: normalizedPayload.product_id,
          productName: normalizedPayload.product_name,
          category: normalizedPayload.category,
          intentType: eventType === 'product_view' ? 'product_view' :
                     eventType === 'product_search' ? 'product_search' :
                     eventType === 'cart_add' ? 'cart_add' :
                     'wishlist_add',
          sourceChannel: 'web',
          sessionId: normalizedPayload.session_id,
          pageUrl: normalizedPayload.page_url,
          searchQuery: normalizedPayload.search_query,
          viewDuration: normalizedPayload.view_duration,
        });
      } catch (intentError) {
        console.error('Error tracking product intent:', intentError);
        // Don't fail the webhook if intent tracking fails
      }
    }

    return {
      success: true,
      eventId: result.eventId,
      profileId: result.profileId || undefined,
    };
  } catch (error) {
    console.error('Error processing Shopify webhook:', error);
    throw error;
  }
}

