// GENERATOR: INTEGRATIONS
// ASSUMPTIONS: WooCommerce webhook payload format, WooCommerce REST API credentials
// HOW TO RUN: Use via /api/integrations/woocommerce/webhook route
// DOCS: https://woocommerce.github.io/woocommerce-rest-api-docs/

import crypto from 'crypto';
import { ingestEvent } from '../ingestion/eventIngestion';
import { trackProductIntent } from '../intent/productIntentService';

export interface WooCommerceWebhookPayload {
  id?: number;
  email?: string;
  billing?: {
    email?: string;
    phone?: string;
    first_name?: string;
    last_name?: string;
  };
  shipping?: {
    first_name?: string;
    last_name?: string;
  };
  total?: string;
  status?: string;
  date_created?: string;
  date_modified?: string;
  line_items?: Array<{
    product_id: number;
    name: string;
    quantity: number;
    total: string;
  }>;
  [key: string]: any;
}

/**
 * Verify WooCommerce webhook signature (HMAC SHA256)
 */
export function verifyWooCommerceWebhook(
  body: string,
  signature: string,
  secret: string
): boolean {
  if (!signature || !secret) {
    return false;
  }

  const hmac = crypto.createHmac('sha256', secret);
  const hash = hmac.update(body, 'utf8').digest('hex');
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
}

/**
 * Transform WooCommerce webhook payload to our event format
 */
export function transformWooCommerceEvent(
  topic: string,
  payload: WooCommerceWebhookPayload
): { eventType: string; normalizedPayload: any } {
  // Map WooCommerce topics to our event types
  const eventTypeMap: Record<string, string> = {
    'order.created': 'purchase',
    'order.updated': 'order_updated',
    'order.deleted': 'order_cancelled',
    'order.paid': 'purchase',
    'order.completed': 'order_completed',
    'customer.created': 'customer_created',
    'customer.updated': 'customer_updated',
    // Custom events (from frontend tracking)
    'product.view': 'product_view',
    'product.search': 'product_search',
    'cart.add': 'cart_add',
    'cart.remove': 'cart_remove',
    'wishlist.add': 'wishlist_add',
  };

  const eventType = eventTypeMap[topic] || topic.replace('.', '_');

  // Normalize payload structure
  const normalizedPayload: any = {
    ...payload,
    // Extract identifiers from billing
    email: payload.email || payload.billing?.email,
    phone: payload.billing?.phone,
    // Extract order data
    total: payload.total ? parseFloat(payload.total) : undefined,
    order_id: payload.id?.toString(),
    // Extract product data for product events
    product_id: payload.product_id || payload.product?.id?.toString(),
    product_name: payload.product_name || payload.product?.name,
    category: payload.category || payload.product?.categories?.[0]?.name,
    // Extract line items for category analysis
    items: payload.line_items?.map((item) => ({
      product_id: item.product_id.toString(),
      name: item.name,
      quantity: item.quantity,
      total: parseFloat(item.total),
    })),
    // Extract search query
    search_query: payload.query || payload.search_query,
    // Extract session data
    session_id: payload.session_id,
    page_url: payload.page_url || payload.url,
    view_duration: payload.view_duration,
    // Preserve original WooCommerce data
    woocommerce_data: payload,
    source: 'woocommerce',
  };

  return { eventType, normalizedPayload };
}

/**
 * Process WooCommerce webhook
 */
export async function processWooCommerceWebhook(
  brandId: string,
  topic: string,
  payload: WooCommerceWebhookPayload
): Promise<{ success: boolean; eventId?: string; profileId?: string }> {
  try {
    const { eventType, normalizedPayload } = transformWooCommerceEvent(topic, payload);

    const result = await ingestEvent({
      brandId,
      eventType,
      payload: normalizedPayload,
    });

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
    console.error('Error processing WooCommerce webhook:', error);
    throw error;
  }
}

