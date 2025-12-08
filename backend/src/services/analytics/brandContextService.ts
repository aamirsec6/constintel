// GENERATOR: SIRI_LIKE_LLM
// Brand context service for rich brand information
// ASSUMPTIONS: Prisma client available, Brand model exists
// HOW TO USE: import { getBrandContext } from './brandContextService'

import { getPrismaClient } from '../../db/prismaClient';
import { getTimeSeriesData } from './timeSeriesService';
import { getSegmentAnalytics } from './segmentAnalyticsService';

const prisma = getPrismaClient();

export interface BrandContext {
  id: string;
  name: string;
  domain?: string;
  industry?: string;
  plan: string;
  settings?: any;
  historicalPatterns?: {
    averageRevenue?: number;
    averageOrders?: number;
    typicalGrowth?: number;
    peakSeasons?: string[];
  };
  segmentInfo?: {
    totalSegments: number;
    segmentNames: string[];
    largestSegment?: string;
  };
  recentActivity?: {
    lastActivityAt?: Date;
    daysSinceLastActivity?: number;
  };
}

/**
 * Get comprehensive brand context for LLM
 */
export async function getBrandContext(
  brandId: string,
  dateRange?: { startDate: Date; endDate: Date }
): Promise<BrandContext | null> {
  try {
    // Fetch brand information
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
      select: {
        id: true,
        name: true,
        domain: true,
        industry: true,
        plan: true,
        settings: true,
        lastActivityAt: true,
      },
    });

    if (!brand) {
      return null;
    }

    const context: BrandContext = {
      id: brand.id,
      name: brand.name,
      domain: brand.domain || undefined,
      industry: brand.industry || undefined,
      plan: brand.plan,
      settings: brand.settings || undefined,
    };

    // Add recent activity info
    if (brand.lastActivityAt) {
      context.recentActivity = {
        lastActivityAt: brand.lastActivityAt,
        daysSinceLastActivity: Math.floor(
          (Date.now() - brand.lastActivityAt.getTime()) / (1000 * 60 * 60 * 24)
        ),
      };
    }

    // Get historical patterns if date range provided
    if (dateRange) {
      try {
        // Get revenue and orders data for pattern analysis
        const revenueData = await getTimeSeriesData(
          brandId,
          'revenue',
          dateRange.startDate,
          dateRange.endDate,
          'day'
        );
        const ordersData = await getTimeSeriesData(
          brandId,
          'orders',
          dateRange.startDate,
          dateRange.endDate,
          'day'
        );

        context.historicalPatterns = {
          averageRevenue: revenueData.summary.average,
          averageOrders: ordersData.summary.average,
          typicalGrowth: revenueData.summary.growth,
        };
      } catch (error) {
        console.warn('Failed to fetch historical patterns:', error);
      }

      // Get segment information
      try {
        const segments = await getSegmentAnalytics(
          brandId,
          dateRange.startDate,
          dateRange.endDate
        );

        if (segments && segments.segments) {
          const segmentNames = segments.segments.map((s: any) => s.name);
          const largestSegment = segments.segments.reduce((max: any, seg: any) => {
            return seg.customerCount > (max?.customerCount || 0) ? seg : max;
          }, null);

          context.segmentInfo = {
            totalSegments: segments.segments.length,
            segmentNames,
            largestSegment: largestSegment?.name,
          };
        }
      } catch (error) {
        console.warn('Failed to fetch segment info:', error);
      }
    }

    return context;
  } catch (error) {
    console.error('Error fetching brand context:', error);
    return null;
  }
}

/**
 * Format brand context for LLM prompt
 */
export function formatBrandContextForPrompt(context: BrandContext): string {
  let prompt = `Brand Information:\n`;
  prompt += `- Name: ${context.name}\n`;
  
  if (context.industry) {
    prompt += `- Industry: ${context.industry}\n`;
  }
  
  if (context.domain) {
    prompt += `- Domain: ${context.domain}\n`;
  }

  if (context.historicalPatterns) {
    prompt += `\nHistorical Patterns:\n`;
    if (context.historicalPatterns.averageRevenue) {
      prompt += `- Average Daily Revenue: $${context.historicalPatterns.averageRevenue.toLocaleString()}\n`;
    }
    if (context.historicalPatterns.averageOrders) {
      prompt += `- Average Daily Orders: ${context.historicalPatterns.averageOrders.toFixed(0)}\n`;
    }
    if (context.historicalPatterns.typicalGrowth) {
      prompt += `- Typical Growth Rate: ${context.historicalPatterns.typicalGrowth.toFixed(1)}%\n`;
    }
  }

  if (context.segmentInfo) {
    prompt += `\nCustomer Segments:\n`;
    prompt += `- Total Segments: ${context.segmentInfo.totalSegments}\n`;
    if (context.segmentInfo.segmentNames.length > 0) {
      prompt += `- Segments: ${context.segmentInfo.segmentNames.join(', ')}\n`;
    }
    if (context.segmentInfo.largestSegment) {
      prompt += `- Largest Segment: ${context.segmentInfo.largestSegment}\n`;
    }
  }

  return prompt;
}

