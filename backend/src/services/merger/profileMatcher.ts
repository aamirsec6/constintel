// GENERATOR: FULL_PLATFORM
// ASSUMPTIONS: Prisma client available, identifiers extracted from events
// HOW TO RUN: import { findProfilesByIdentifiers } from './profileMatcher'

import { getPrismaClient } from '../../db/prismaClient';
import { ExtractedIdentifiers } from './identifierExtractor';

const prisma = getPrismaClient();

/**
 * Priority order for identifier matching (higher priority first)
 */
const IDENTIFIER_PRIORITY = [
  'phone',
  'email',
  'loyalty_id',
  'qr_id',
  'whatsapp',
  'upi',
  'card_last4',
  'device_id',
  'cookie_id',
] as const;

/**
 * Find existing profiles matching any of the provided identifiers
 * Returns array of profile IDs that match
 */
export async function findProfilesByIdentifiers(
  brandId: string,
  identifiers: ExtractedIdentifiers
): Promise<string[]> {
  const profileIds = new Set<string>();

  // Query by each identifier in priority order
  // Using raw SQL for JSONB queries (Prisma's JSON filtering is limited)
  for (const identifierType of IDENTIFIER_PRIORITY) {
    const value = identifiers[identifierType];
    if (!value) continue;

    // Use PostgreSQL JSONB operator to query
    // Note: For production, consider creating GIN indexes on identifiers column
    // CREATE INDEX idx_identifiers_gin ON customer_profile USING GIN (identifiers);
    const profiles = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM customer_profile
      WHERE brand_id = ${brandId}
        AND identifiers->>${identifierType} = ${value}
    `;

    profiles.forEach((p) => profileIds.add(p.id));
  }

  return Array.from(profileIds);
}

/**
 * Calculate profile strength (0-100) based on identifier count and quality
 */
export function calculateProfileStrength(identifiers: ExtractedIdentifiers): number {
  let strength = 0;
  const weights: Record<string, number> = {
    phone: 20,
    email: 20,
    loyalty_id: 15,
    qr_id: 15,
    whatsapp: 10,
    upi: 10,
    card_last4: 5,
    device_id: 3,
    cookie_id: 2,
  };

  for (const [key, weight] of Object.entries(weights)) {
    if (identifiers[key as keyof ExtractedIdentifiers]) {
      strength += weight;
    }
  }

  return Math.min(100, strength);
}

