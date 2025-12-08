// GENERATOR: FULL_PLATFORM
// ASSUMPTIONS: Prisma client, profiles exist, merge logic follows priority rules
// HOW TO RUN: import { mergeProfiles } from './profileMerger'

import { getPrismaClient } from '../../db/prismaClient';
import { ExtractedIdentifiers, extractIdentifiers } from './identifierExtractor';
import { calculateProfileStrength } from './profileMatcher';
import { withMergeLock } from '../redis/locking';

const prisma = getPrismaClient();

const MAX_AUTO_MERGE_PROFILES = parseInt(process.env.MAX_AUTO_MERGE_PROFILES || '3', 10);
const ENABLE_AUTO_MERGE = process.env.ENABLE_AUTO_MERGE !== 'false';

export interface MergeResult {
  success: boolean;
  profileId: string;
  mergedCount: number;
  requiresManualReview: boolean;
  manualMergeQueueId?: string;
}

/**
 * Merge multiple profiles into one base profile
 * If merging > MAX_AUTO_MERGE_PROFILES, creates manual review queue entry
 * Uses Redis locking to prevent race conditions
 */
export async function mergeProfiles(
  brandId: string,
  profileIds: string[],
  reason: string = 'identifier_match'
): Promise<MergeResult> {
  if (profileIds.length < 2) {
    throw new Error('Need at least 2 profiles to merge');
  }

  // Use locking to prevent concurrent merges on the same profiles
  // Lock on the first profile ID (base profile)
  const baseProfileId = profileIds[0];
  
  return await withMergeLock(baseProfileId, async () => {
    return await performMerge(brandId, profileIds, reason);
  });
}

/**
 * Internal merge function (called within lock)
 */
async function performMerge(
  brandId: string,
  profileIds: string[],
  reason: string = 'identifier_match'
): Promise<MergeResult> {

  // If too many profiles, require manual review
  if (profileIds.length > MAX_AUTO_MERGE_PROFILES && ENABLE_AUTO_MERGE) {
    const queueEntry = await prisma.manualMergeQueue.create({
      data: {
        profileIds: profileIds,
        reason: `Auto-merge blocked: ${profileIds.length} profiles exceed threshold of ${MAX_AUTO_MERGE_PROFILES}`,
        status: 'pending',
      },
    });

    return {
      success: false,
      profileId: profileIds[0], // Return first as placeholder
      mergedCount: 0,
      requiresManualReview: true,
      manualMergeQueueId: queueEntry.id,
    };
  }

  // Get all profiles to merge
  const profiles = await prisma.customerProfile.findMany({
    where: {
      id: { in: profileIds },
      brandId,
    },
  });

  if (profiles.length < 2) {
    throw new Error('Not all profiles found');
  }

  // Sort by profile strength and creation date (strongest/oldest first)
  profiles.sort((a, b) => {
    if (b.profileStrength !== a.profileStrength) {
      return b.profileStrength - a.profileStrength;
    }
    return a.createdAt.getTime() - b.createdAt.getTime();
  });

  const baseProfile = profiles[0];
  const profilesToMerge = profiles.slice(1);

  // Create before snapshot
  const beforeSnapshot = {
    base: {
      id: baseProfile.id,
      identifiers: baseProfile.identifiers,
      lifetimeValue: baseProfile.lifetimeValue.toString(),
      totalOrders: baseProfile.totalOrders,
    },
    merged: profilesToMerge.map((p) => ({
      id: p.id,
      identifiers: p.identifiers,
      lifetimeValue: p.lifetimeValue.toString(),
      totalOrders: p.totalOrders,
    })),
  };

  // Merge identifiers (combine all unique values)
  const mergedIdentifiers: any = { ...(baseProfile.identifiers as any) };
  for (const profile of profilesToMerge) {
    const ids = profile.identifiers as any;
    for (const [key, value] of Object.entries(ids)) {
      if (value && !mergedIdentifiers[key]) {
        mergedIdentifiers[key] = value;
      }
    }
  }

  // Calculate new profile strength
  const extractedIds = extractIdentifiers(mergedIdentifiers);
  const newStrength = calculateProfileStrength(extractedIds);

  // Sum lifetime value and orders
  const totalLtv = profiles.reduce(
    (sum, p) => sum + parseFloat(p.lifetimeValue.toString()),
    0
  );
  const totalOrders = profiles.reduce((sum, p) => sum + p.totalOrders, 0);

  // Perform merge in transaction
  const result = await prisma.$transaction(async (tx) => {
    // Update base profile
    const updated = await tx.customerProfile.update({
      where: { id: baseProfile.id },
      data: {
        identifiers: mergedIdentifiers,
        profileStrength: newStrength,
        lifetimeValue: totalLtv,
        totalOrders,
        updatedAt: new Date(),
      },
    });

    // Update all events to point to base profile
    await tx.customerRawEvent.updateMany({
      where: {
        customerProfileId: { in: profilesToMerge.map((p) => p.id) },
      },
      data: {
        customerProfileId: baseProfile.id,
      },
    });

    // Create merge history entry
    await tx.mergeHistory.create({
      data: {
        baseProfileId: baseProfile.id,
        mergedProfileId: profilesToMerge[0].id, // Store first merged, or could store array
        reason,
        beforeSnapshot,
        afterSnapshot: {
          id: updated.id,
          identifiers: updated.identifiers,
          lifetimeValue: updated.lifetimeValue.toString(),
          totalOrders: updated.totalOrders,
        },
      },
    });

    // Delete merged profiles (cascade will handle related records)
    await tx.customerProfile.deleteMany({
      where: {
        id: { in: profilesToMerge.map((p) => p.id) },
      },
    });

    return updated;
  });

  return {
    success: true,
    profileId: result.id,
    mergedCount: profilesToMerge.length,
    requiresManualReview: false,
  };
}

