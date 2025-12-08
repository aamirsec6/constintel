// GENERATOR: OMNICHANNEL_PLATFORM
// ASSUMPTIONS: Prisma client, store visit service, product intent service
// HOW TO RUN: import { createInStoreAlert, getActiveAlerts } from './inStoreAlertService'

import { getPrismaClient } from '../../db/prismaClient';
import { getHighIntentProducts } from '../intent/productIntentService';

const prisma = getPrismaClient();

export interface CreateAlertParams {
  brandId: string;
  storeId: string;
  visitId: string;
  profileId: string;
  deliveryMethod?: 'store_app' | 'sms' | 'whatsapp' | 'pos_screen';
}

/**
 * Create in-store alert for a customer visit
 * Auto-detects high-intent products and creates alert
 */
export async function createInStoreAlert(params: CreateAlertParams): Promise<string> {
  const {
    brandId,
    storeId,
    visitId,
    profileId,
    deliveryMethod = 'store_app',
  } = params;

  // Get customer profile
  const profile = await prisma.customerProfile.findUnique({
    where: { id: profileId },
    include: {
      predictions: true,
    },
  });

  if (!profile) {
    throw new Error('Profile not found');
  }

  // Get high-intent products
  const highIntentProducts = await getHighIntentProducts(brandId, profileId, 5);
  
  // Determine alert type and content
  let alertType = 'product_intent';
  let title = 'Customer Visit';
  let message = 'Customer is in store';
  const productIds: string[] = [];

  if (highIntentProducts.length > 0) {
    alertType = 'product_intent';
    const productNames = highIntentProducts
      .map((p: any) => p.productName)
      .filter(Boolean)
      .slice(0, 3);
    
    title = `Customer Interested in ${productNames[0] || 'Products'}`;
    message = `Customer viewed: ${productNames.join(', ')}. High purchase intent!`;
    productIds.push(...highIntentProducts.map((p: any) => p.productId));
  } else if (profile.lifetimeValue.toNumber() > 1000) {
    alertType = 'high_value_customer';
    title = 'High-Value Customer';
    message = `VIP customer (LTV: $${profile.lifetimeValue.toFixed(2)})`;
  } else if (profile.predictions?.churnScore && profile.predictions.churnScore > 0.7) {
    alertType = 'churn_risk';
    title = 'At-Risk Customer';
    message = `High churn risk (${(profile.predictions.churnScore * 100).toFixed(0)}%). Consider retention offer.`;
  }

  // Create alert
  const alert = await prisma.inStoreAlert.create({
    data: {
      brandId,
      storeId,
      visitId,
      profileId,
      alertType,
      title,
      message,
      productIds: productIds as any,
      deliveryMethod,
      deliveryStatus: 'pending',
    },
  });

  return alert.id;
}

/**
 * Get active alerts for a store
 */
export async function getActiveAlerts(
  brandId: string,
  storeId: string
): Promise<any[]> {
  return prisma.inStoreAlert.findMany({
    where: {
      brandId,
      storeId,
      deliveryStatus: { in: ['pending', 'delivered'] },
      visit: {
        status: 'active',
        checkOutAt: null,
      },
    },
    include: {
      profile: {
        select: {
          id: true,
          identifiers: true,
          lifetimeValue: true,
          totalOrders: true,
          profileStrength: true,
        },
      },
      visit: {
        select: {
          id: true,
          checkInAt: true,
          detectionMethod: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Mark alert as viewed by store staff
 */
export async function markAlertAsViewed(alertId: string): Promise<void> {
  await prisma.inStoreAlert.update({
    where: { id: alertId },
    data: {
      deliveryStatus: 'viewed',
      viewedAt: new Date(),
    },
  });
}

/**
 * Mark alert as delivered
 */
export async function markAlertAsDelivered(alertId: string): Promise<void> {
  await prisma.inStoreAlert.update({
    where: { id: alertId },
    data: {
      deliveryStatus: 'delivered',
      deliveredAt: new Date(),
    },
  });
}

/**
 * Auto-create alerts for high-intent customers when they visit
 * Called automatically when store visit is detected
 */
export async function autoCreateAlertsForVisit(
  brandId: string,
  storeId: string,
  visitId: string,
  profileId: string | null
): Promise<void> {
  if (!profileId) {
    return; // No profile, no alert
  }

  // Get high-intent products
  const highIntentProducts = await getHighIntentProducts(brandId, profileId, 1);
  
  // Only create alert if customer has high intent (score >= 50)
  if (highIntentProducts.length > 0) {
    await createInStoreAlert({
      brandId,
      storeId,
      visitId,
      profileId,
      deliveryMethod: 'store_app',
    });
  }
}

