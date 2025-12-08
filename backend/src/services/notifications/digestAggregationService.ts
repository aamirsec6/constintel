// GENERATOR: CUSTOMER_NOTIFICATIONS
// Digest aggregation service
// HOW TO RUN: Import and use to generate customer activity digests

import { getPrismaClient } from '../../db/prismaClient';
import { getEventTypeConfig } from './eventTypeConfigService';
import { subHours, subDays, startOfHour, startOfDay } from 'date-fns';

export interface DigestSummary {
  new_customers: number;
  purchases: number;
  high_value_purchases: number;
  cart_abandonments: number;
  total_events: number;
}

export interface Digest {
  id: string;
  period: string;
  brandId: string;
  instanceId: string;
  summary: DigestSummary;
  events: Array<{
    type: string;
    count: number;
    sample: any[];
  }>;
}

/**
 * Generate digest for a time period
 */
export async function generateDigest(
  brandId: string,
  instanceId: string,
  period: 'hourly' | 'daily'
): Promise<Digest | null> {
  const prisma = await getPrismaClient();
  
  // Calculate time range
  const now = new Date();
  const startTime = period === 'hourly' 
    ? startOfHour(subHours(now, 1))
    : startOfDay(subDays(now, 1));
  
  // Get events for the period
  const events = await prisma.customerActivityEvent.findMany({
    where: {
      brandId,
      instanceId,
      createdAt: {
        gte: startTime,
        lte: now
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  
  if (events.length === 0) {
    return null;
  }
  
  // Get event type configs to filter enabled events
  const enabledEventTypes = new Set<string>();
  for (const event of events) {
    const config = await getEventTypeConfig(brandId, event.eventType);
    if (config?.enabled) {
      enabledEventTypes.add(event.eventType);
    }
  }
  
  const filteredEvents = events.filter(e => enabledEventTypes.has(e.eventType));
  
  // Aggregate events
  const eventMap = new Map<string, any[]>();
  for (const event of filteredEvents) {
    if (!eventMap.has(event.eventType)) {
      eventMap.set(event.eventType, []);
    }
    eventMap.get(event.eventType)!.push(event);
  }
  
  // Build summary
  const summary: DigestSummary = {
    new_customers: eventMap.get('new_customer')?.length || 0,
    purchases: eventMap.get('purchase')?.length || 0,
    high_value_purchases: eventMap.get('high_value_purchase')?.length || 0,
    cart_abandonments: eventMap.get('cart_abandonment')?.length || 0,
    total_events: filteredEvents.length
  };
  
  // Build event details
  const eventDetails = Array.from(eventMap.entries()).map(([type, eventList]) => ({
    type,
    count: eventList.length,
    sample: eventList.slice(0, 10).map(e => ({
      profileId: e.profileId,
      createdAt: e.createdAt,
      eventData: e.eventData
    }))
  }));
  
  // Save digest to database
  const digest = await prisma.customerEventDigest.create({
    data: {
      brandId,
      instanceId,
      periodType: period,
      periodStart: startTime,
      periodEnd: now,
      summary: summary as any,
      events: eventDetails as any
    }
  });
  
  return {
    id: digest.id,
    period: `${startTime.toISOString()} - ${now.toISOString()}`,
    brandId,
    instanceId,
    summary,
    events: eventDetails
  };
}

