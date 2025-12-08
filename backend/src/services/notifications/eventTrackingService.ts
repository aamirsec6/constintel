// GENERATOR: CUSTOMER_NOTIFICATIONS
// Event tracking service for customer activity
// HOW TO RUN: Import and use to track customer events

import { getPrismaClient } from '../../db/prismaClient';

/**
 * Track new customer event
 */
export async function trackNewCustomer(
  brandId: string,
  instanceId: string,
  profileId: string,
  customerData?: any
): Promise<void> {
  const prisma = await getPrismaClient();
  
  // Store event for digest aggregation
  await prisma.customerActivityEvent.create({
    data: {
      brandId,
      instanceId,
      profileId,
      eventType: 'new_customer',
      eventData: customerData || {},
      importance: 'high'
    }
  });
}

/**
 * Track customer event
 */
export async function trackCustomerEvent(
  brandId: string,
  instanceId: string,
  profileId: string,
  eventType: string,
  eventData?: any
): Promise<void> {
  const prisma = await getPrismaClient();
  
  // Determine importance based on event type
  const importance = getEventImportance(eventType);
  
  await prisma.customerActivityEvent.create({
    data: {
      brandId,
      instanceId,
      profileId,
      eventType,
      eventData: eventData || {},
      importance
    }
  });
}

function getEventImportance(eventType: string): 'high' | 'medium' | 'low' {
  const highImportance = ['purchase', 'high_value_purchase', 'churn_risk'];
  const mediumImportance = ['cart_abandonment', 'profile_update', 'high_ltv_customer'];
  
  if (highImportance.includes(eventType)) {
    return 'high';
  } else if (mediumImportance.includes(eventType)) {
    return 'medium';
  }
  return 'low';
}

