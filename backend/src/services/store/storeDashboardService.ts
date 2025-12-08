// GENERATOR: OMNICHANNEL_PLATFORM
// ASSUMPTIONS: Prisma client, alert service, intent service
// HOW TO RUN: import { getStoreDashboard, lookupCustomer } from './storeDashboardService'

import { getPrismaClient } from '../../db/prismaClient';
import { getActiveAlerts } from '../alerts/inStoreAlertService';
import { getHighIntentProducts } from '../intent/productIntentService';
import { getCustomer360 } from '../customer360/customer360Service';

const prisma = getPrismaClient();

/**
 * Get store dashboard data
 */
export async function getStoreDashboard(
  brandId: string,
  storeId: string
): Promise<any> {
  // Get active alerts
  const alerts = await getActiveAlerts(brandId, storeId);

  // Get active visits
  const activeVisits = await prisma.storeVisit.findMany({
    where: {
      brandId,
      storeId,
      status: 'active',
      checkOutAt: null,
    },
    include: {
      profile: {
        select: {
          id: true,
          identifiers: true,
          lifetimeValue: true,
          totalOrders: true,
        },
      },
    },
    orderBy: { checkInAt: 'desc' },
  });

  // Get recent visits (last 24 hours)
  const recentVisits = await prisma.storeVisit.findMany({
    where: {
      brandId,
      storeId,
      checkInAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    },
    include: {
      profile: {
        select: {
          id: true,
          identifiers: true,
        },
      },
    },
    orderBy: { checkInAt: 'desc' },
    take: 20,
  });

  return {
    activeAlerts: alerts.length,
    activeVisits: activeVisits.length,
    recentVisits: recentVisits.length,
    alerts: alerts.slice(0, 10), // Top 10 alerts
    activeCustomers: activeVisits.map(visit => ({
      profileId: visit.profileId,
      identifiers: visit.profile?.identifiers,
      checkInAt: visit.checkInAt,
      hasAlert: alerts.some(a => a.profileId === visit.profileId),
    })),
  };
}

/**
 * Lookup customer by phone, email, or loyalty ID
 */
export async function lookupCustomer(
  brandId: string,
  storeId: string,
  identifier: string
): Promise<any> {
  // Try to find profile by identifier
  const profiles = await prisma.customerProfile.findMany({
    where: {
      brandId,
      OR: [
        { identifiers: { path: ['phone'], equals: identifier } },
        { identifiers: { path: ['email'], equals: identifier } },
        { identifiers: { path: ['loyalty_id'], equals: identifier } },
      ],
    },
    include: {
      predictions: true,
      features: true,
    },
    take: 1,
  });

  if (profiles.length === 0) {
    return null;
  }

  const profile = profiles[0];

  // Get high-intent products
  const highIntentProducts = await getHighIntentProducts(brandId, profile.id, 5);

  // Get recent store visits
  const recentVisits = await prisma.storeVisit.findMany({
    where: {
      brandId,
      storeId,
      profileId: profile.id,
    },
    orderBy: { checkInAt: 'desc' },
    take: 5,
  });

  // Get active alerts for this customer
  const activeAlerts = await prisma.inStoreAlert.findMany({
    where: {
      brandId,
      storeId,
      profileId: profile.id,
      deliveryStatus: { in: ['pending', 'delivered'] },
      visit: {
        status: 'active',
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Get purchase history (last 10)
  const purchaseEvents = await prisma.customerRawEvent.findMany({
    where: {
      brandId,
      customerProfileId: profile.id,
      eventType: { in: ['purchase', 'pos_transaction'] },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  return {
    profile: {
      id: profile.id,
      identifiers: profile.identifiers,
      lifetimeValue: profile.lifetimeValue,
      totalOrders: profile.totalOrders,
      profileStrength: profile.profileStrength,
    },
    predictions: profile.predictions,
    highIntentProducts: highIntentProducts.map((p: any) => ({
      productId: p.productId,
      productName: p.productName,
      category: p.category,
      intentScore: p.intentScore,
    })),
    recentVisits: recentVisits.map(visit => ({
      id: visit.id,
      checkInAt: visit.checkInAt,
      checkOutAt: visit.checkOutAt,
      duration: visit.duration,
    })),
    activeAlerts: activeAlerts.map(alert => ({
      id: alert.id,
      title: alert.title,
      message: alert.message,
      productIds: alert.productIds,
      alertType: alert.alertType,
    })),
    purchaseHistory: purchaseEvents.map(event => ({
      id: event.id,
      eventType: event.eventType,
      payload: event.payload,
      createdAt: event.createdAt,
    })),
    isVip: profile.lifetimeValue.toNumber() > 1000,
    isHighValue: profile.lifetimeValue.toNumber() > 500,
    churnRisk: profile.predictions?.churnScore || 0,
  };
}

/**
 * Get customer recommendations for store staff
 */
export async function getCustomerRecommendations(
  brandId: string,
  profileId: string
): Promise<any> {
  const profile = await prisma.customerProfile.findUnique({
    where: { id: profileId },
    include: {
      predictions: true,
    },
  });

  if (!profile || profile.brandId !== brandId) {
    throw new Error('Profile not found');
  }

  // Get product recommendations from ML
  const recommendations = profile.predictions?.recommendations as any[] || [];

  // Get high-intent products
  const highIntentProducts = await getHighIntentProducts(brandId, profileId, 5);

  // Get purchase history to avoid recommending already purchased items
  const purchasedProductIds = new Set<string>();
  const purchaseEvents = await prisma.customerRawEvent.findMany({
    where: {
      brandId,
      customerProfileId: profileId,
      eventType: { in: ['purchase', 'pos_transaction'] },
    },
  });

  purchaseEvents.forEach(event => {
    const payload = event.payload as any;
    const items = payload.items || [];
    items.forEach((item: any) => {
      if (item.product_id) {
        purchasedProductIds.add(item.product_id);
      }
    });
  });

  // Filter out already purchased products
  const filteredRecommendations = recommendations.filter((rec: any) => {
    const productId = rec.product_id || rec.id;
    return !purchasedProductIds.has(productId);
  });

  return {
    mlRecommendations: filteredRecommendations.slice(0, 5),
    highIntentProducts: highIntentProducts.map((p: any) => ({
      productId: p.productId,
      productName: p.productName,
      category: p.category,
      intentScore: p.intentScore,
      reason: 'Customer viewed this product online',
    })),
    upsellOpportunities: filteredRecommendations.slice(0, 3).map((rec: any) => ({
      productId: rec.product_id || rec.id,
      productName: rec.name,
      reason: 'Based on purchase history',
    })),
  };
}

