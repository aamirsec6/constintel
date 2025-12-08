// GENERATOR: PROFILE_STATISTICS
// Service to update customer profile statistics from events
// HOW TO RUN: import { updateProfileStatistics } from './profileStatisticsService'

import { getPrismaClient } from '../../db/prismaClient';

const prisma = getPrismaClient();

/**
 * Update profile statistics (LTV, total orders) from purchase events
 */
export async function updateProfileStatistics(profileId: string): Promise<void> {
  // Get all purchase events for this profile (including all POS transaction types)
  const purchaseEvents = await prisma.customerRawEvent.findMany({
    where: {
      customerProfileId: profileId,
      eventType: { 
        in: [
          'purchase', 
          'pos_transaction', 
          'pos_sale',
          'pos_purchase',
          'order_created',
          'order_paid'
        ] 
      },
    },
  });

  // Calculate lifetime value and order count
  let totalLTV = 0;
  let orderCount = 0;

  for (const event of purchaseEvents) {
    const payload = event.payload as any;
    
    // Extract total from various possible fields (handle different event formats)
    const total = parseFloat(
      payload.total_spent || 
      payload.total || 
      payload.amount || 
      payload.order_total ||
      payload.transaction_amount ||
      payload.subtotal && payload.tax ? 
        (parseFloat(payload.subtotal) + parseFloat(payload.tax || '0')).toString() : 
        '0'
    );
    
    if (total > 0) {
      totalLTV += total;
      orderCount++;
    }
  }

  // Update profile
  await prisma.customerProfile.update({
    where: { id: profileId },
    data: {
      lifetimeValue: totalLTV,
      totalOrders: orderCount,
      updatedAt: new Date(),
    },
  });
}

/**
 * Update statistics for all profiles in a brand (batch operation)
 */
export async function updateAllProfileStatistics(brandId: string): Promise<{
  updated: number;
  totalLTV: number;
  totalOrders: number;
}> {
  const profiles = await prisma.customerProfile.findMany({
    where: { brandId },
    select: { id: true },
  });

  let updated = 0;
  let totalLTV = 0;
  let totalOrders = 0;

  for (const profile of profiles) {
    try {
      await updateProfileStatistics(profile.id);
      
      // Get updated profile to sum totals
      const updatedProfile = await prisma.customerProfile.findUnique({
        where: { id: profile.id },
        select: {
          lifetimeValue: true,
          totalOrders: true,
        },
      });

      if (updatedProfile) {
        totalLTV += parseFloat(updatedProfile.lifetimeValue.toString());
        totalOrders += updatedProfile.totalOrders;
      }

      updated++;
    } catch (error) {
      // Continue on error
    }
  }

  return { updated, totalLTV, totalOrders };
}

