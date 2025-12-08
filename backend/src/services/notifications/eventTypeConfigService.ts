// GENERATOR: CUSTOMER_NOTIFICATIONS
// Event type configuration service
// HOW TO RUN: Import and use to manage event type configurations

import { getPrismaClient } from '../../db/prismaClient';

export interface EventTypeConfig {
  eventType: string;
  enabled: boolean;
  importance: 'high' | 'medium' | 'low';
  digestFrequency: 'hourly' | 'daily';
}

const DEFAULT_EVENT_TYPES: EventTypeConfig[] = [
  { eventType: 'new_customer', enabled: true, importance: 'high', digestFrequency: 'hourly' },
  { eventType: 'purchase', enabled: true, importance: 'high', digestFrequency: 'hourly' },
  { eventType: 'high_value_purchase', enabled: true, importance: 'high', digestFrequency: 'hourly' },
  { eventType: 'cart_abandonment', enabled: true, importance: 'medium', digestFrequency: 'daily' },
  { eventType: 'profile_update', enabled: false, importance: 'low', digestFrequency: 'daily' },
  { eventType: 'high_ltv_customer', enabled: true, importance: 'high', digestFrequency: 'hourly' },
  { eventType: 'churn_risk', enabled: true, importance: 'high', digestFrequency: 'hourly' },
  { eventType: 'returning_customer', enabled: true, importance: 'medium', digestFrequency: 'daily' }
];

/**
 * Get event type configuration for a brand
 */
export async function getEventTypeConfig(
  brandId: string,
  eventType: string
): Promise<EventTypeConfig | null> {
  const prisma = await getPrismaClient();
  
  let config = await prisma.notificationEventConfig.findUnique({
    where: {
      brandId_eventType: {
        brandId,
        eventType
      }
    }
  });
  
  // If not found, use default
  if (!config) {
    const defaultConfig = DEFAULT_EVENT_TYPES.find(c => c.eventType === eventType);
    if (defaultConfig) {
      // Create default config
      config = await prisma.notificationEventConfig.create({
        data: {
          brandId,
          eventType: defaultConfig.eventType,
          enabled: defaultConfig.enabled,
          importance: defaultConfig.importance,
          digestFrequency: defaultConfig.digestFrequency
        }
      });
    }
  }
  
  if (!config) {
    return null;
  }
  
  return {
    eventType: config.eventType,
    enabled: config.enabled,
    importance: config.importance as 'high' | 'medium' | 'low',
    digestFrequency: config.digestFrequency as 'hourly' | 'daily'
  };
}

/**
 * Get all event type configurations for a brand
 */
export async function getAllEventTypeConfigs(brandId: string): Promise<EventTypeConfig[]> {
  const prisma = await getPrismaClient();
  
  // Get all configs, create defaults for missing ones
  const configs = await prisma.notificationEventConfig.findMany({
    where: { brandId }
  });
  
  const configMap = new Map(configs.map(c => [c.eventType, c]));
  const result: EventTypeConfig[] = [];
  
  for (const defaultConfig of DEFAULT_EVENT_TYPES) {
    let config = configMap.get(defaultConfig.eventType);
    if (!config) {
      // Create default
      config = await prisma.notificationEventConfig.create({
        data: {
          brandId,
          eventType: defaultConfig.eventType,
          enabled: defaultConfig.enabled,
          importance: defaultConfig.importance,
          digestFrequency: defaultConfig.digestFrequency
        }
      });
    }
    
    result.push({
      eventType: config.eventType,
      enabled: config.enabled,
      importance: config.importance as 'high' | 'medium' | 'low',
      digestFrequency: config.digestFrequency as 'hourly' | 'daily'
    });
  }
  
  return result;
}

/**
 * Update event type configuration
 */
export async function updateEventTypeConfig(
  brandId: string,
  eventType: string,
  updates: Partial<EventTypeConfig>
): Promise<EventTypeConfig> {
  const prisma = await getPrismaClient();
  
  const config = await prisma.notificationEventConfig.upsert({
    where: {
      brandId_eventType: {
        brandId,
        eventType
      }
    },
    create: {
      brandId,
      eventType,
      enabled: updates.enabled ?? true,
      importance: updates.importance ?? 'medium',
      digestFrequency: updates.digestFrequency ?? 'daily'
    },
    update: {
      ...(updates.enabled !== undefined && { enabled: updates.enabled }),
      ...(updates.importance && { importance: updates.importance }),
      ...(updates.digestFrequency && { digestFrequency: updates.digestFrequency })
    }
  });
  
  return {
    eventType: config.eventType,
    enabled: config.enabled,
    importance: config.importance as 'high' | 'medium' | 'low',
    digestFrequency: config.digestFrequency as 'hourly' | 'daily'
  };
}

