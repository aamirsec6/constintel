// GENERATOR: OMNICHANNEL_PLATFORM
// ASSUMPTIONS: Prisma client, all services available
// HOW TO RUN: import { getCustomer360, getCustomerTimeline, getCustomerJourney } from './customer360Service'

import { getPrismaClient } from '../../db/prismaClient';
import { getActiveIntents } from '../intent/productIntentService';
import { getCustomerVisits } from '../store/storeVisitService';
import { getCustomer360Cache, setCustomer360Cache, invalidateCustomer360Cache } from '../redis/cache';

const prisma = getPrismaClient();

/**
 * Get complete Customer 360 view (with caching)
 */
export async function getCustomer360(brandId: string, profileId: string): Promise<any> {
  // Check cache first
  const cached = await getCustomer360Cache(brandId, profileId);
  if (cached) {
    return cached;
  }
  // Get profile with all related data
  const profile = await prisma.customerProfile.findUnique({
    where: { id: profileId },
    include: {
      predictions: true,
      features: true,
      rawEvents: {
        take: 100,
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!profile || profile.brandId !== brandId) {
    throw new Error('Profile not found');
  }

  // Get product intents
  const productIntents = await getActiveIntents(brandId, profileId, {
    minScore: 0,
    limit: 20,
    sortBy: 'score',
  });

  // Get store visits
  const storeVisits = await getCustomerVisits(brandId, profileId, 20);

  // Get journey
  const journey = await prisma.customerJourney.findUnique({
    where: { profileId },
  });

  // Get campaign history
  const campaignExecutions = await prisma.campaignExecution.findMany({
    where: {
      profileId,
    },
    include: {
      campaign: {
        select: {
          id: true,
          name: true,
          campaignType: true,
        },
      },
    },
    orderBy: { sentAt: 'desc' },
    take: 20,
  });

  // Get attribution data
  const attributions = await prisma.attribution.findMany({
    where: {
      profileId,
    },
    orderBy: { conversionAt: 'desc' },
    take: 10,
  });

  // Get raw events separately
  const rawEvents = await prisma.customerRawEvent.findMany({
    where: {
      brandId,
      customerProfileId: profileId,
    },
    take: 1000,
    orderBy: { createdAt: 'desc' },
  });

  // Aggregate purchase history
  const purchaseEvents = rawEvents.filter(e => 
    e.eventType === 'purchase' || e.eventType === 'pos_transaction'
  );

  // Aggregate conversations (WhatsApp, email, support)
  const conversationEvents = rawEvents.filter(e =>
    e.eventType.includes('whatsapp') || 
    e.eventType.includes('email') || 
    e.eventType.includes('support')
  );

  // Aggregate returns/exchanges
  const returnEvents = rawEvents.filter(e =>
    e.eventType === 'return' || e.eventType === 'exchange'
  );

  // Calculate channel preference
  const channelUsage: Record<string, number> = {};
  rawEvents.forEach(event => {
    const payload = event.payload as any;
    const channel = payload.channel || payload.source || 'unknown';
    channelUsage[channel] = (channelUsage[channel] || 0) + 1;
  });

  const preferredChannel = Object.entries(channelUsage)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || 'unknown';

  // Calculate category affinity
  const categoryAffinity: Record<string, number> = {};
  purchaseEvents.forEach(event => {
    const payload = event.payload as any;
    const items = payload.items || [];
    items.forEach((item: any) => {
      const category = item.category || 'unknown';
      categoryAffinity[category] = (categoryAffinity[category] || 0) + 1;
    });
  });

  return {
    profile: {
      id: profile.id,
      identifiers: profile.identifiers,
      profileStrength: profile.profileStrength,
      lifetimeValue: profile.lifetimeValue,
      totalOrders: profile.totalOrders,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    },
    predictions: profile.predictions,
    features: profile.features,
    productIntents: productIntents.map(intent => ({
      id: intent.id,
      productId: intent.productId,
      productName: intent.productName,
      category: intent.category,
      intentScore: intent.intentScore,
      intentType: intent.intentType,
      lastSeenAt: intent.lastSeenAt,
    })),
    storeVisits: storeVisits.map(visit => ({
      id: visit.id,
      storeId: visit.storeId,
      storeName: visit.storeName,
      checkInAt: visit.checkInAt,
      checkOutAt: visit.checkOutAt,
      duration: visit.duration,
      detectionMethod: visit.detectionMethod,
    })),
    journey: journey ? {
      currentStage: journey.currentStage,
      previousStage: journey.previousStage,
      nextMilestone: journey.nextMilestone,
      nextBestAction: journey.nextBestAction,
      journeyScore: journey.journeyScore,
    } : null,
    campaignHistory: campaignExecutions.map(exec => ({
      campaignId: exec.campaign.id,
      campaignName: exec.campaign.name,
      channel: exec.channel,
      status: exec.status,
      sentAt: exec.sentAt,
      openedAt: exec.openedAt,
      clickedAt: exec.clickedAt,
      convertedAt: exec.convertedAt,
    })),
    attribution: attributions.map(attr => ({
      conversionType: attr.conversionType,
      conversionValue: attr.conversionValue,
      conversionAt: attr.conversionAt,
      attributionModel: attr.attributionModel,
      channelCredits: attr.channelCredits,
    })),
    statistics: {
      totalPurchases: purchaseEvents.length,
      totalConversations: conversationEvents.length,
      totalReturns: returnEvents.length,
      totalStoreVisits: storeVisits.length,
      activeProductIntents: productIntents.length,
      preferredChannel,
      categoryAffinity: Object.entries(categoryAffinity)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([category, count]) => ({ category, count })),
    },
  };
}

/**
 * Get customer interaction timeline
 */
export async function getCustomerTimeline(
  brandId: string,
  profileId: string,
  limit: number = 100
): Promise<any[]> {
  const profile = await prisma.customerProfile.findUnique({
    where: { id: profileId },
  });

  if (!profile || profile.brandId !== brandId) {
    throw new Error('Profile not found');
  }

  // Get all events
  const events = await prisma.customerRawEvent.findMany({
    where: {
      brandId,
      customerProfileId: profileId,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  // Get store visits
  const visits = await getCustomerVisits(brandId, profileId, 50);

  // Get campaign executions
  const campaigns = await prisma.campaignExecution.findMany({
    where: { profileId },
    include: {
      campaign: {
        select: { name: true },
      },
    },
    orderBy: { sentAt: 'desc' },
    take: 50,
  });

  // Combine and sort by date
  const timeline: any[] = [];

  events.forEach(event => {
    timeline.push({
      type: 'event',
      id: event.id,
      eventType: event.eventType,
      payload: event.payload,
      timestamp: event.createdAt,
    });
  });

  visits.forEach(visit => {
    timeline.push({
      type: 'store_visit',
      id: visit.id,
      storeId: visit.storeId,
      storeName: visit.storeName,
      checkInAt: visit.checkInAt,
      checkOutAt: visit.checkOutAt,
      timestamp: visit.checkInAt,
    });
  });

  campaigns.forEach(campaign => {
    if (campaign.sentAt) {
      timeline.push({
        type: 'campaign',
        id: campaign.id,
        campaignName: campaign.campaign.name,
        channel: campaign.channel,
        status: campaign.status,
        timestamp: campaign.sentAt,
      });
    }
  });

  // Sort by timestamp (most recent first)
  timeline.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return timeline.slice(0, limit);
}

/**
 * Get customer journey stages
 */
export async function getCustomerJourney(
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

  let journey = await prisma.customerJourney.findUnique({
    where: { profileId },
  });

  // Create journey if it doesn't exist
  // Get raw events count
  const eventsCount = await prisma.customerRawEvent.count({
    where: {
      brandId,
      customerProfileId: profileId,
    },
  });

  if (!journey) {
    // Determine initial stage based on profile data
    let currentStage = 'awareness';
    
    if (profile.totalOrders > 0) {
      currentStage = 'purchase';
    } else if (eventsCount > 0) {
      currentStage = 'consideration';
    }

    journey = await prisma.customerJourney.create({
      data: {
        brandId,
        profileId,
        currentStage,
        touchpoints: [] as any,
        journeyScore: 0,
      },
    });
  }

  // Update journey based on recent activity
  const recentEvents = await prisma.customerRawEvent.findMany({
    where: {
      brandId,
      customerProfileId: profileId,
      createdAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Determine next best action
  let nextBestAction: string | null = null;
  let nextMilestone: string | null = null;

  if (journey.currentStage === 'awareness') {
    nextBestAction = 'Engage with product recommendations';
    nextMilestone = 'likely_to_view_products';
  } else if (journey.currentStage === 'consideration') {
    nextBestAction = 'Send personalized offer';
    nextMilestone = 'likely_to_purchase_in_7_days';
  } else if (journey.currentStage === 'purchase') {
    nextBestAction = 'Upsell related products';
    nextMilestone = 'likely_to_repurchase';
  } else if (journey.currentStage === 'retention') {
    nextBestAction = 'Maintain engagement';
    nextMilestone = 'become_advocate';
  }

  // Calculate journey score (0-100)
  let journeyScore = 0;
  if (profile.totalOrders > 0) journeyScore += 40;
  if (profile.lifetimeValue.toNumber() > 100) journeyScore += 20;
  if (profile.lifetimeValue.toNumber() > 500) journeyScore += 20;
  if (recentEvents.length > 5) journeyScore += 10;
  if (profile.predictions?.churnScore && profile.predictions.churnScore < 0.3) journeyScore += 10;

  // Update journey
  await prisma.customerJourney.update({
    where: { id: journey.id },
    data: {
      nextBestAction,
      nextMilestone,
      journeyScore,
      touchpoints: recentEvents.map(e => ({
        type: e.eventType,
        timestamp: e.createdAt,
        payload: e.payload,
      })) as any,
    },
  });

  return {
    currentStage: journey.currentStage,
    previousStage: journey.previousStage,
    nextMilestone,
    nextBestAction,
    journeyScore,
    touchpoints: recentEvents.length,
  };

  // Cache the result (5 minutes)
  await setCustomer360Cache(brandId, profileId, result);
  
  return result;
}

/**
 * Get complete customer history
 */
export async function getCustomerHistory(
  brandId: string,
  profileId: string
): Promise<any> {
  const profile = await prisma.customerProfile.findUnique({
    where: { id: profileId },
  });

  if (!profile || profile.brandId !== brandId) {
    throw new Error('Profile not found');
  }

  // Get all events grouped by type
  const allEvents = await prisma.customerRawEvent.findMany({
    where: {
      brandId,
      customerProfileId: profileId,
    },
    orderBy: { createdAt: 'desc' },
  });

  const purchases = allEvents.filter(e => e.eventType === 'purchase' || e.eventType === 'pos_transaction');
  const conversations = allEvents.filter(e => 
    e.eventType.includes('whatsapp') || 
    e.eventType.includes('email') || 
    e.eventType.includes('support')
  );
  const returns = allEvents.filter(e => e.eventType === 'return' || e.eventType === 'exchange');
  const views = allEvents.filter(e => e.eventType === 'product_view' || e.eventType === 'page_view');

  // Get store visits
  const visits = await getCustomerVisits(brandId, profileId, 100);

  // Get product intents
  const intents = await getActiveIntents(brandId, profileId, { limit: 50 });

  // Get campaign history
  const campaigns = await prisma.campaignExecution.findMany({
    where: { profileId },
    include: {
      campaign: {
        select: { name: true, campaignType: true },
      },
    },
    orderBy: { sentAt: 'desc' },
  });

  return {
    purchases: purchases.map(e => ({
      id: e.id,
      eventType: e.eventType,
      payload: e.payload,
      createdAt: e.createdAt,
    })),
    conversations: conversations.map(e => ({
      id: e.id,
      eventType: e.eventType,
      payload: e.payload,
      createdAt: e.createdAt,
    })),
    returns: returns.map(e => ({
      id: e.id,
      eventType: e.eventType,
      payload: e.payload,
      createdAt: e.createdAt,
    })),
    views: views.map(e => ({
      id: e.id,
      eventType: e.eventType,
      payload: e.payload,
      createdAt: e.createdAt,
    })),
    storeVisits: visits,
    productIntents: intents,
    campaigns: campaigns.map(c => ({
      id: c.id,
      campaignName: c.campaign.name,
      channel: c.channel,
      status: c.status,
      sentAt: c.sentAt,
      openedAt: c.openedAt,
      clickedAt: c.clickedAt,
    })),
  };
}

