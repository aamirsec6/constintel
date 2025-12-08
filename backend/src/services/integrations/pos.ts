// GENERATOR: INTEGRATIONS
// ASSUMPTIONS: Generic POS system payload format
// HOW TO RUN: Use via /api/integrations/pos/event route
// This is a generic POS integration that accepts various POS formats

import { ingestEvent } from '../ingestion/eventIngestion';
import { detectStoreVisit } from '../store/storeVisitService';
import { markIntentAsConverted } from '../intent/productIntentService';

export interface POSEventPayload {
  // Common POS fields
  transaction_id?: string;
  store_id?: string;
  cashier_id?: string;
  customer?: {
    phone?: string;
    email?: string;
    loyalty_id?: string;
    name?: string;
  };
  items?: Array<{
    product_id?: string;
    sku?: string;
    name?: string;
    quantity?: number;
    price?: number;
    category?: string;
  }>;
  total?: number;
  payment_method?: string;
  timestamp?: string;
  [key: string]: any;
}

/**
 * Transform generic POS event to our event format
 * Handles various POS system formats
 */
export function transformPOSEvent(
  payload: POSEventPayload
): { eventType: string; normalizedPayload: any } {
  // Determine event type
  let eventType = 'pos_transaction';
  if (payload.transaction_type) {
    eventType = `pos_${payload.transaction_type.toLowerCase()}`;
  } else if (payload.type) {
    eventType = `pos_${payload.type.toLowerCase()}`;
  }

  // Normalize payload structure
  const normalizedPayload: any = {
    ...payload,
    // Extract customer identifiers
    phone: payload.customer?.phone || payload.phone || payload.customer_phone,
    email: payload.customer?.email || payload.email || payload.customer_email,
    loyalty_id: payload.customer?.loyalty_id || payload.loyalty_id,
    // Extract transaction data
    total: payload.total || payload.amount || payload.transaction_amount,
    transaction_id: payload.transaction_id || payload.id,
    store_id: payload.store_id || payload.location_id,
    // Extract items for category analysis
    items: payload.items || payload.line_items || [],
    // Preserve original POS data
    pos_data: payload,
    source: 'pos',
  };

  return { eventType, normalizedPayload };
}

/**
 * Process POS event
 */
export async function processPOSEvent(
  brandId: string,
  payload: POSEventPayload
): Promise<{ success: boolean; eventId?: string; profileId?: string; visitId?: string }> {
  try {
    const { eventType, normalizedPayload } = transformPOSEvent(payload);

    const result = await ingestEvent({
      brandId,
      eventType,
      payload: normalizedPayload,
    });

    // Detect store visit from POS transaction
    let visitId: string | undefined;
    if (result.profileId && normalizedPayload.store_id) {
      try {
        const visitResult = await detectStoreVisit({
          brandId,
          storeId: normalizedPayload.store_id,
          storeName: normalizedPayload.store_name,
          detectionMethod: 'pos_lookup',
          phone: normalizedPayload.phone,
          email: normalizedPayload.email,
          loyaltyId: normalizedPayload.loyalty_id,
        });
        visitId = visitResult.visitId;
      } catch (visitError) {
        console.error('Error detecting store visit from POS:', visitError);
        // Don't fail the POS event if visit detection fails
      }
    }

    // Mark product intents as converted if customer purchased products
    if (result.profileId && normalizedPayload.items && Array.isArray(normalizedPayload.items)) {
      for (const item of normalizedPayload.items) {
        if (item.product_id) {
          try {
            await markIntentAsConverted(brandId, result.profileId, item.product_id);
          } catch (intentError) {
            console.error('Error marking intent as converted:', intentError);
            // Don't fail the POS event if intent conversion fails
          }
        }
      }
    }

    return {
      success: true,
      eventId: result.eventId,
      profileId: result.profileId || undefined,
      visitId,
    };
  } catch (error) {
    console.error('Error processing POS event:', error);
    throw error;
  }
}

