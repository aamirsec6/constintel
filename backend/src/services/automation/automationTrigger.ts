// GENERATOR: OMNICHANNEL_PLATFORM
// ASSUMPTIONS: Automation service, event ingestion
// HOW TO RUN: Called automatically when events are ingested

import { getPrismaClient } from '../../db/prismaClient';
import { evaluateAutomation, executeAutomation } from './automationService';

const prisma = getPrismaClient();

/**
 * Evaluate and trigger automations for a profile
 * Called after events are ingested or predictions are updated
 */
export async function triggerAutomationsForProfile(
  brandId: string,
  profileId: string,
  eventType?: string
): Promise<void> {
  // Get all enabled automations for this brand
  const automations = await prisma.marketingAutomation.findMany({
    where: {
      brandId,
      enabled: true,
    },
    orderBy: {
      priority: 'desc',
    },
  });

  // Evaluate each automation
  for (const automation of automations) {
    try {
      const shouldTrigger = await evaluateAutomation(automation.id, profileId);
      
      if (shouldTrigger) {
      // Execute automation
      const triggerType = (automation.trigger as any)?.type || 'custom';
      await executeAutomation(
        automation.id,
        profileId,
        eventType || triggerType
      ).catch((err) => {
          console.error(`Error executing automation ${automation.id}:`, err);
          // Continue with other automations even if one fails
        });
      }
    } catch (error) {
      console.error(`Error evaluating automation ${automation.id}:`, error);
      // Continue with other automations
    }
  }
}

/**
 * Trigger automations after event ingestion
 * This should be called from the event ingestion service
 */
export async function onEventIngested(
  brandId: string,
  profileId: string,
  eventType: string
): Promise<void> {
  // Trigger automations that might be interested in this event
  await triggerAutomationsForProfile(brandId, profileId, eventType);
}

/**
 * Trigger automations after predictions are updated
 * This should be called when ML predictions are refreshed
 */
export async function onPredictionsUpdated(
  brandId: string,
  profileId: string
): Promise<void> {
  // Trigger automations that depend on predictions (churn, LTV, etc.)
  await triggerAutomationsForProfile(brandId, profileId);
}

