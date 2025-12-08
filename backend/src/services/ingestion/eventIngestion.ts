// GENERATOR: FULL_PLATFORM
// ASSUMPTIONS: Prisma client, merger service available, brand_id in payload or header
// HOW TO RUN: import { ingestEvent } from './eventIngestion'

import { getPrismaClient } from '../../db/prismaClient';
import { extractIdentifiers } from '../merger/identifierExtractor';
import { findProfilesByIdentifiers } from '../merger/profileMatcher';
import { mergeProfiles } from '../merger/profileMerger';
import { calculateProfileStrength } from '../merger/profileMatcher';
import { publishRawEvent, publishNormalizedEvent, publishMergeRequest } from '../streams/eventPublisher';

const prisma = getPrismaClient();

export interface IngestEventParams {
  brandId: string;
  eventType: string;
  payload: any;
}

export interface IngestEventResult {
  eventId: string;
  profileId: string | null;
  profileCreated: boolean;
  profilesMerged: boolean;
}

/**
 * Main event ingestion function
 * 1. Creates raw event
 * 2. Extracts identifiers
 * 3. Finds or creates profile
 * 4. Attaches event to profile
 * 5. Handles profile merging if needed
 */
export async function ingestEvent(params: IngestEventParams): Promise<IngestEventResult> {
  const { brandId, eventType, payload } = params;
  const timestamp = new Date().toISOString();

  // Extract identifiers from payload
  const identifiers = extractIdentifiers(payload);

  // Publish raw event to stream (async, don't wait)
  let rawEventId: string | null = null;
  try {
    // We'll publish after creating the event, but prepare the data
    const tempEventId = `temp-${Date.now()}`;
    
    // Find existing profiles matching these identifiers
    const matchingProfileIds = await findProfilesByIdentifiers(brandId, identifiers);

    let profileId: string | null = null;
    let profileCreated = false;
    let profilesMerged = false;
    let requiresManualReview = false;

    if (matchingProfileIds.length === 0) {
      // No matching profile - create new one
      const profileStrength = calculateProfileStrength(identifiers);
      // Convert identifiers to plain object for Prisma JSON field
      const identifiersObj = identifiers as any;
      
      const newProfile = await prisma.customerProfile.create({
        data: {
          brandId,
          identifiers: identifiersObj,
          profileStrength,
        },
      });
      profileId = newProfile.id;
      profileCreated = true;
      
      // Track new customer for notifications (async, don't wait)
      try {
        const { notifyNewCustomer } = await import('../notifications/customerActivityNotificationService');
        const brand = await prisma.brand.findUnique({
          where: { id: brandId },
          select: { instanceId: true }
        });
        notifyNewCustomer(brandId, brand?.instanceId || brandId, profileId, identifiers).catch((err) => {
          console.error('Error notifying new customer:', err);
        });
      } catch (err) {
        // Notification service might not be available - continue silently
      }
    } else if (matchingProfileIds.length === 1) {
      // Single match - use it and update identifiers if new ones are found
      profileId = matchingProfileIds[0];
      
      // Merge any new identifiers into the existing profile
      const existingProfile = await prisma.customerProfile.findUnique({
        where: { id: profileId },
        select: { identifiers: true },
      });
      
      if (existingProfile) {
        const existingIds = existingProfile.identifiers as any;
        const mergedIdentifiers: any = { ...existingIds };
        let hasNewIdentifiers = false;
        
        // Add any new identifiers that don't exist yet
        for (const [key, value] of Object.entries(identifiers)) {
          if (value && !mergedIdentifiers[key]) {
            mergedIdentifiers[key] = value;
            hasNewIdentifiers = true;
          }
        }
        
        // If new identifiers were found, update the profile
        if (hasNewIdentifiers) {
          const newStrength = calculateProfileStrength(mergedIdentifiers);
          await prisma.customerProfile.update({
            where: { id: profileId },
            data: {
              identifiers: mergedIdentifiers,
              profileStrength: newStrength,
              updatedAt: new Date(),
            },
          });
        }
      }
    } else {
      // Multiple matches - merge profiles
      try {
        const mergeResult = await mergeProfiles(brandId, matchingProfileIds, 'identifier_match');
        profileId = mergeResult.profileId;
        profilesMerged = mergeResult.success;
        requiresManualReview = mergeResult.requiresManualReview || false;
        
        // Publish merge request to stream
        if (profilesMerged || requiresManualReview) {
          publishMergeRequest({
            brandId,
            profileIds: matchingProfileIds,
            reason: 'identifier_match',
            requiresManualReview,
          }).catch((err) => {
            console.error('Error publishing merge request to stream:', err);
          });
        }
        
        if (requiresManualReview) {
          console.warn(`Manual review required for profiles: ${matchingProfileIds.join(', ')}`);
        }
      } catch (error) {
        console.error('Error merging profiles:', error);
        // Fallback to first profile
        profileId = matchingProfileIds[0];
      }
    }

    // Create raw event and attach to profile
    const event = await prisma.customerRawEvent.create({
      data: {
        brandId,
        eventType,
        payload,
        customerProfileId: profileId,
      },
    });
    
    // Track customer event for notifications (async, don't wait)
    try {
      const { notifyCustomerEvent } = await import('../notifications/customerActivityNotificationService');
      const brand = await prisma.brand.findUnique({
        where: { id: brandId },
        select: { instanceId: true }
      });
      notifyCustomerEvent(brandId, brand?.instanceId || brandId, profileId, eventType, payload).catch((err) => {
        console.error('Error notifying customer event:', err);
      });
    } catch (err) {
      // Notification service might not be available - continue silently
    }

    // Publish raw event to stream (async)
    publishRawEvent({
      eventId: event.id,
      brandId,
      eventType,
      payload,
      timestamp,
    }).catch((err) => {
      console.error('Error publishing raw event to stream:', err);
    });

    // Publish normalized event to stream (async)
    // Convert identifiers to plain object for JSON serialization
    const identifiersObj: Record<string, string> = {};
    Object.entries(identifiers).forEach(([key, value]) => {
      if (value) {
        identifiersObj[key] = String(value);
      }
    });

    publishNormalizedEvent({
      eventId: event.id,
      brandId,
      eventType,
      profileId,
      identifiers: identifiersObj,
      normalizedPayload: payload, // In future, this could be more normalized
      timestamp,
    }).catch((err) => {
      console.error('Error publishing normalized event to stream:', err);
    });

    return {
      eventId: event.id,
      profileId,
      profileCreated,
      profilesMerged,
    };
  } catch (error) {
    console.error('Error ingesting event:', error);
    throw error;
  }
}

/**
 * Attach an existing event to a profile (used when profile is created/merged later)
 */
export async function attachEvent(eventId: string, profileId: string): Promise<void> {
  await prisma.customerRawEvent.update({
    where: { id: eventId },
    data: { customerProfileId: profileId },
  });
}

