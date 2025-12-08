// GENERATOR: OMNICHANNEL_PLATFORM
// ASSUMPTIONS: Prisma client, profile matcher
// HOW TO RUN: import { detectStoreVisit, getActiveVisits } from './storeVisitService'

import { getPrismaClient } from '../../db/prismaClient';
import { extractIdentifiers } from '../merger/identifierExtractor';
import { findProfilesByIdentifiers } from '../merger/profileMatcher';
import { getHighIntentProducts } from '../intent/productIntentService';
import { autoCreateAlertsForVisit } from '../alerts/inStoreAlertService';

const prisma = getPrismaClient();

export interface StoreVisitParams {
  brandId: string;
  storeId: string;
  storeName?: string;
  detectionMethod: 'geofence' | 'qr_scan' | 'pos_lookup' | 'checkin' | 'wifi';
  location?: {
    lat: number;
    lng: number;
    accuracy?: number;
  };
  // Identifier fields for profile matching
  phone?: string;
  email?: string;
  loyaltyId?: string;
  deviceId?: string;
  qrCode?: string;
  macAddress?: string; // For WiFi check-in
}

export interface StoreVisitResult {
  visitId: string;
  profileId: string | null | undefined;
  profileCreated: boolean;
  hasHighIntent: boolean;
}

/**
 * Detect and record a store visit
 * Matches customer via identifiers and creates visit record
 */
export async function detectStoreVisit(params: StoreVisitParams): Promise<StoreVisitResult> {
  const {
    brandId,
    storeId,
    storeName,
    detectionMethod,
    location,
    phone,
    email,
    loyaltyId,
    deviceId,
    qrCode,
    macAddress,
  } = params;

  // Extract identifiers from visit data
  const identifiers = extractIdentifiers({
    phone,
    email,
    loyalty_id: loyaltyId,
    device_id: deviceId,
    qr_id: qrCode,
  });

  // Find or create customer profile
  let profileId: string | null = null;
  let profileCreated = false;

  if (Object.keys(identifiers).length > 0) {
    const matchingProfileIds = await findProfilesByIdentifiers(brandId, identifiers);

    if (matchingProfileIds.length === 0) {
      // Create new profile if we have identifiers
      const { calculateProfileStrength } = require('../merger/profileMatcher');
      const profileStrength = calculateProfileStrength(identifiers);
      
      const newProfile = await prisma.customerProfile.create({
        data: {
          brandId,
          identifiers: identifiers as any,
          profileStrength,
        },
      });
      profileId = newProfile.id;
      profileCreated = true;
    } else {
      profileId = matchingProfileIds[0];
    }
  }

  // Create store visit record
  const visit = await prisma.storeVisit.create({
    data: {
      brandId,
      profileId: profileId ?? null,
      storeId,
      storeName,
      detectionMethod,
      location: location ? (location as any) : null,
      status: 'active',
      checkInAt: new Date(),
    },
  });

  // Check for high-intent products if we have a profile
  let hasHighIntent = false;
  if (profileId) {
    const highIntentProducts = await getHighIntentProducts(brandId, profileId, 1);
    hasHighIntent = highIntentProducts.length > 0;

    // Update visit with active intents
    if (highIntentProducts.length > 0) {
      const intentIds = highIntentProducts.map((p: any) => p.id);
      await prisma.storeVisit.update({
        where: { id: visit.id },
        data: {
          activeIntents: intentIds as any,
        },
      });
    }

    // Auto-create alert for high-intent customers
    await autoCreateAlertsForVisit(brandId, storeId, visit.id, profileId).catch((err) => {
      console.error('Error creating alert for visit:', err);
      // Don't fail the visit creation if alert creation fails
    });
  }

  return {
    visitId: visit.id,
    profileId: profileId ?? undefined,
    profileCreated,
    hasHighIntent,
  };
}

/**
 * Complete a store visit (customer checked out)
 */
export async function completeStoreVisit(
  brandId: string,
  visitId: string
): Promise<void> {
  const visit = await prisma.storeVisit.findFirst({
    where: {
      id: visitId,
      brandId,
      status: 'active',
    },
  });

  if (!visit) {
    throw new Error('Active visit not found');
  }

  const checkOutAt = new Date();
  const duration = Math.floor((checkOutAt.getTime() - visit.checkInAt.getTime()) / (1000 * 60)); // minutes

  await prisma.storeVisit.update({
    where: { id: visitId },
    data: {
      status: 'completed',
      checkOutAt,
      duration,
    },
  });
}

/**
 * Get active store visits for a store
 */
export async function getActiveVisits(
  brandId: string,
  storeId: string
): Promise<any[]> {
  return prisma.storeVisit.findMany({
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
    orderBy: {
      checkInAt: 'desc',
    },
  });
}

/**
 * Get recent visits for a store
 */
export async function getRecentVisits(
  brandId: string,
  storeId: string,
  limit: number = 50
): Promise<any[]> {
  return prisma.storeVisit.findMany({
    where: {
      brandId,
      storeId,
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
    orderBy: {
      checkInAt: 'desc',
    },
    take: limit,
  });
}

/**
 * Get visits for a customer profile
 */
export async function getCustomerVisits(
  brandId: string,
  profileId: string,
  limit: number = 20
): Promise<any[]> {
  return prisma.storeVisit.findMany({
    where: {
      brandId,
      profileId,
    },
    orderBy: {
      checkInAt: 'desc',
    },
    take: limit,
  });
}

