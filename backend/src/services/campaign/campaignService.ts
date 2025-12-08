// GENERATOR: OMNICHANNEL_PLATFORM
// ASSUMPTIONS: Prisma client, profile matching, integrations
// HOW TO RUN: import { createCampaign, executeCampaign, getCampaignPerformance } from './campaignService'

import { getPrismaClient } from '../../db/prismaClient';
import { findProfilesByIdentifiers } from '../merger/profileMatcher';

const prisma = getPrismaClient();

export interface CampaignTarget {
  segment?: string; // RFM segment
  rfm?: {
    recency?: { min?: number; max?: number };
    frequency?: { min?: number; max?: number };
    monetary?: { min?: number; max?: number };
  };
  custom?: any[]; // Custom profile IDs or filters
}

export interface CampaignSchedule {
  start_date?: string; // ISO date
  end_date?: string; // ISO date
  frequency?: 'once' | 'daily' | 'weekly' | 'monthly';
  time_of_day?: string; // HH:mm format
}

export interface CampaignMessage {
  subject?: string;
  body: string;
  personalization_fields?: string[]; // ['name', 'product_recommendations', 'offer']
}

export interface CreateCampaignParams {
  brandId: string;
  name: string;
  description?: string;
  campaignType: 'one_time' | 'recurring' | 'triggered';
  schedule?: CampaignSchedule;
  targetSegment?: CampaignTarget;
  targetChannels: string[]; // ['whatsapp', 'email', 'sms']
  messageTemplate: CampaignMessage;
  personalization?: {
    product_recommendations?: boolean;
    dynamic_offers?: boolean;
    [key: string]: any;
  };
  abTestEnabled?: boolean;
  abTestVariants?: any[];
  duplicatePrevention?: boolean;
  exclusionRules?: {
    exclude_recent_purchasers?: boolean;
    exclude_segments?: string[];
    [key: string]: any;
  };
}

/**
 * Create a new marketing campaign
 */
export async function createCampaign(params: CreateCampaignParams): Promise<string> {
  const {
    brandId,
    name,
    description,
    campaignType,
    schedule,
    targetSegment,
    targetChannels,
    messageTemplate,
    personalization,
    abTestEnabled = false,
    abTestVariants,
    duplicatePrevention = true,
    exclusionRules,
  } = params;

  const campaign = await prisma.campaign.create({
    data: {
      brandId,
      name,
      description,
      campaignType,
      schedule: schedule as any,
      targetSegment: targetSegment as any,
      targetChannels: targetChannels as any,
      messageTemplate: messageTemplate as any,
      personalization: personalization as any,
      abTestEnabled,
      abTestVariants: abTestVariants as any,
      duplicatePrevention,
      exclusionRules: exclusionRules as any,
      status: 'draft',
    },
  });

  return campaign.id;
}

/**
 * Get target profiles for a campaign based on targeting rules
 */
export async function getTargetProfiles(campaignId: string): Promise<string[]> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign) {
    throw new Error('Campaign not found');
  }

  const targetSegment = campaign.targetSegment as CampaignTarget | null;
  const exclusionRules = campaign.exclusionRules as any;

  // Build query conditions
  const where: any = {
    brandId: campaign.brandId,
  };

  // Apply segment targeting
  if (targetSegment?.segment) {
    where.predictions = {
      segment: targetSegment.segment,
    };
  }

  // Apply RFM targeting
  if (targetSegment?.rfm) {
    // This would require more complex queries - simplified for now
    // In production, use feature values to filter
  }

  // Get profiles matching target
  let profiles = await prisma.customerProfile.findMany({
    where,
    select: { id: true },
  });

  let profileIds = profiles.map(p => p.id);

  // Apply custom targeting
  if (targetSegment?.custom && Array.isArray(targetSegment.custom)) {
    profileIds = targetSegment.custom;
  }

  // Apply exclusion rules
  if (exclusionRules) {
    if (exclusionRules.exclude_recent_purchasers) {
      // Exclude customers who purchased in last 7 days
      const recentPurchasers = await prisma.customerRawEvent.findMany({
        where: {
          brandId: campaign.brandId,
          eventType: 'purchase',
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
        select: { customerProfileId: true },
        distinct: ['customerProfileId'],
      });

      const recentPurchaserIds = recentPurchasers
        .map(e => e.customerProfileId)
        .filter(Boolean) as string[];

      profileIds = profileIds.filter(id => !recentPurchaserIds.includes(id));
    }

    if (exclusionRules.exclude_segments && Array.isArray(exclusionRules.exclude_segments)) {
      const excludedProfiles = await prisma.customerProfile.findMany({
        where: {
          brandId: campaign.brandId,
          predictions: {
            segment: { in: exclusionRules.exclude_segments },
          },
        },
        select: { id: true },
      });

      const excludedIds = excludedProfiles.map(p => p.id);
      profileIds = profileIds.filter(id => !excludedIds.includes(id));
    }
  }

  // Check duplicate prevention
  if (campaign.duplicatePrevention) {
    // Exclude profiles who already received this campaign
    const existingExecutions = await prisma.campaignExecution.findMany({
      where: {
        campaignId,
        status: { in: ['sent', 'delivered', 'opened', 'clicked'] },
      },
      select: { profileId: true },
      distinct: ['profileId'],
    });

    const existingIds = existingExecutions.map(e => e.profileId);
    profileIds = profileIds.filter(id => !existingIds.includes(id));
  }

  return profileIds;
}

/**
 * Execute a campaign - send to all target profiles
 */
export async function executeCampaign(campaignId: string): Promise<{
  totalTargeted: number;
  sent: number;
  failed: number;
}> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign) {
    throw new Error('Campaign not found');
  }

  // Update campaign status
  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      status: 'active',
      startedAt: new Date(),
    },
  });

  // Get target profiles
  const targetProfileIds = await getTargetProfiles(campaignId);
  const totalTargeted = targetProfileIds.length;

  let sent = 0;
  let failed = 0;

  const targetChannels = campaign.targetChannels as string[];
  const messageTemplate = campaign.messageTemplate as any as CampaignMessage;
  const personalization = campaign.personalization as any;

  // Send to each profile
  for (const profileId of targetProfileIds) {
    try {
      const profile = await prisma.customerProfile.findUnique({
        where: { id: profileId },
        include: {
          predictions: true,
        },
      });

      if (!profile) {
        failed++;
        continue;
      }

      // Determine channel (prefer channel with identifier)
      const identifiers = profile.identifiers as any;
      let selectedChannel: string | null = null;

      for (const channel of targetChannels) {
        if (channel === 'whatsapp' && (identifiers.whatsapp || identifiers.phone)) {
          selectedChannel = channel;
          break;
        } else if (channel === 'email' && identifiers.email) {
          selectedChannel = channel;
          break;
        } else if (channel === 'sms' && identifiers.phone) {
          selectedChannel = channel;
          break;
        }
      }

      if (!selectedChannel) {
        failed++;
        continue; // No valid channel for this profile
      }

      // Personalize message
      let personalizedMessage = messageTemplate.body;
      if (personalization?.product_recommendations && profile.predictions?.recommendations) {
        const recommendations = profile.predictions.recommendations as any[];
        if (Array.isArray(recommendations) && recommendations.length > 0) {
          const productNames = recommendations.slice(0, 3).map((r: any) => r.name || r.product_id).join(', ');
          personalizedMessage = personalizedMessage.replace('{product_recommendations}', productNames);
        }
      }

      // Send message
      await sendCampaignMessage(profile, selectedChannel, {
        subject: messageTemplate.subject,
        body: personalizedMessage,
      });

      // Create execution record
      await prisma.campaignExecution.create({
        data: {
          campaignId,
          profileId,
          channel: selectedChannel,
          status: 'sent',
          sentAt: new Date(),
        },
      });

      sent++;
    } catch (error) {
      console.error(`Error sending campaign to profile ${profileId}:`, error);
      
      // Create failed execution record
      await prisma.campaignExecution.create({
        data: {
          campaignId,
          profileId,
          channel: 'unknown',
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      failed++;
    }
  }

  // Update campaign status if completed
  if (sent + failed >= totalTargeted) {
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
    });
  }

  return {
    totalTargeted,
    sent,
    failed,
  };
}

/**
 * Send campaign message via specified channel
 */
async function sendCampaignMessage(
  profile: any,
  channel: string,
  message: { subject?: string; body: string }
): Promise<void> {
  const identifiers = profile.identifiers as any;

  switch (channel) {
    case 'whatsapp':
      const whatsappNumber = identifiers.whatsapp || identifiers.phone;
      if (whatsappNumber) {
        // TODO: Implement actual Twilio WhatsApp send
        console.log(`Sending WhatsApp to ${whatsappNumber}: ${message.body}`);
      }
      break;

    case 'email':
      if (identifiers.email) {
        // TODO: Implement actual email send
        console.log(`Sending email to ${identifiers.email}: ${message.subject} - ${message.body}`);
      }
      break;

    case 'sms':
      if (identifiers.phone) {
        // TODO: Implement actual SMS send
        console.log(`Sending SMS to ${identifiers.phone}: ${message.body}`);
      }
      break;
  }
}

/**
 * Get campaign performance metrics
 */
export async function getCampaignPerformance(campaignId: string): Promise<any> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign) {
    throw new Error('Campaign not found');
  }

  const executions = await prisma.campaignExecution.findMany({
    where: { campaignId },
  });

  const total = executions.length;
  const sent = executions.filter(e => e.status === 'sent' || e.deliveredAt).length;
  const delivered = executions.filter(e => e.deliveredAt).length;
  const opened = executions.filter(e => e.openedAt).length;
  const clicked = executions.filter(e => e.clickedAt).length;
  const converted = executions.filter(e => e.convertedAt).length;
  const failed = executions.filter(e => e.status === 'failed').length;

  return {
    total,
    sent,
    delivered,
    opened,
    clicked,
    converted,
    failed,
    deliveryRate: total > 0 ? (delivered / total) * 100 : 0,
    openRate: delivered > 0 ? (opened / delivered) * 100 : 0,
    clickRate: delivered > 0 ? (clicked / delivered) * 100 : 0,
    conversionRate: delivered > 0 ? (converted / delivered) * 100 : 0,
  };
}

/**
 * Get all campaigns for a brand
 */
export async function getCampaigns(brandId: string, status?: string): Promise<any[]> {
  const where: any = { brandId };
  if (status) {
    where.status = status;
  }

  return prisma.campaign.findMany({
    where,
    include: {
      executions: {
        take: 1,
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

