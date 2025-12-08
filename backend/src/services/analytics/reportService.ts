// GENERATOR: OLLAMA_INTEGRATION
// Report generation service for analytics
// ASSUMPTIONS: ML service LLM endpoints available, comprehensive analytics data
// HOW TO USE: import { generateReport } from './reportService'

import axios from 'axios';
import { getRedisClient } from '../redis/redisClient';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || process.env.NEXT_PUBLIC_ML_API_URL || 'http://localhost:8000';
const LLM_ENABLED = process.env.ENABLE_REPORT_GENERATION === 'true';

export interface ReportOptions {
  format?: 'text' | 'markdown' | 'pdf';
  sections?: string[];
}

export interface ReportResult {
  report: string;
  format: string;
  sections: string[];
  generatedAt: string;
}

/**
 * Generate comprehensive analytics report
 */
export async function generateReport(
  brandId: string,
  dateRange: { startDate: Date; endDate: Date },
  analyticsData: {
    revenue?: any;
    orders?: any;
    customers?: any;
    segments?: any;
    insights?: any;
  },
  options: ReportOptions = {}
): Promise<ReportResult> {
  const format = options.format || 'markdown';
  const sections = options.sections || [
    'executive_summary',
    'metrics',
    'insights',
    'recommendations',
  ];

  if (!LLM_ENABLED) {
    return generateFallbackReport(analyticsData, dateRange, format, sections);
  }

  // Check cache
  const cacheKey = `report:${brandId}:${dateRange.startDate.toISOString()}:${dateRange.endDate.toISOString()}:${sections.join(',')}`;
  
  try {
    const redis = await getRedisClient();
    const cached = await redis.get(cacheKey);
    if (cached) {
      const result = JSON.parse(cached);
      return { ...result, format };
    }
  } catch (error) {
    console.warn('Redis cache not available for report:', error);
  }

  try {
    const response = await axios.post(`${ML_SERVICE_URL}/llm/generate-report`, {
      revenue: analyticsData.revenue || {},
      orders: analyticsData.orders || {},
      customers: analyticsData.customers || {},
      segments: analyticsData.segments || {},
      dateRange: {
        startDate: dateRange.startDate.toISOString().split('T')[0],
        endDate: dateRange.endDate.toISOString().split('T')[0],
      },
      sections,
    }, {
      timeout: 60000, // 60 second timeout for reports
    });

    if (response.data.success && response.data.data?.report) {
      const result: ReportResult = {
        report: response.data.data.report,
        format,
        sections,
        generatedAt: response.data.data.generatedAt || new Date().toISOString(),
      };

      // Cache the result (15 minute TTL)
      try {
        const redis = await getRedisClient();
        await redis.setex(cacheKey, 900, JSON.stringify(result));
      } catch (error) {
        console.warn('Failed to cache report:', error);
      }

      return result;
    }

    return generateFallbackReport(analyticsData, dateRange, format, sections);
  } catch (error: any) {
    console.error('Error generating report from LLM:', error.message);
    return generateFallbackReport(analyticsData, dateRange, format, sections);
  }
}

/**
 * Generate fallback report when LLM is unavailable
 */
function generateFallbackReport(
  analyticsData: any,
  dateRange: { startDate: Date; endDate: Date },
  format: string,
  sections: string[]
): ReportResult {
  const lines: string[] = [];
  
  if (format === 'markdown') {
    lines.push('# Analytics Report');
    lines.push('');
    lines.push(`**Period:** ${dateRange.startDate.toISOString().split('T')[0]} to ${dateRange.endDate.toISOString().split('T')[0]}`);
    lines.push(`**Generated:** ${new Date().toISOString()}`);
    lines.push('');
  } else {
    lines.push('Analytics Report');
    lines.push('');
    lines.push(`Period: ${dateRange.startDate.toISOString().split('T')[0]} to ${dateRange.endDate.toISOString().split('T')[0]}`);
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push('');
  }

  if (sections.includes('executive_summary')) {
    if (format === 'markdown') {
      lines.push('## Executive Summary');
    } else {
      lines.push('EXECUTIVE SUMMARY');
      lines.push('─'.repeat(50));
    }
    lines.push('');
    
    const revenue = analyticsData.revenue;
    if (revenue) {
      lines.push(`Total revenue: $${revenue.total?.toLocaleString() || 0}`);
      lines.push(`Growth rate: ${revenue.growth?.toFixed(1) || 0}%`);
    }
    lines.push('');
  }

  if (sections.includes('metrics')) {
    if (format === 'markdown') {
      lines.push('## Key Metrics');
    } else {
      lines.push('KEY METRICS');
      lines.push('─'.repeat(50));
    }
    lines.push('');

    if (analyticsData.revenue) {
      lines.push(`Revenue: $${analyticsData.revenue.total?.toLocaleString() || 0}`);
    }
    if (analyticsData.orders) {
      lines.push(`Orders: ${analyticsData.orders.total?.toLocaleString() || 0}`);
      lines.push(`Average Order Value: $${analyticsData.orders.avgOrderValue?.toLocaleString() || 0}`);
    }
    if (analyticsData.customers) {
      lines.push(`Customers: ${analyticsData.customers.total?.toLocaleString() || 0}`);
      lines.push(`New Customers: ${analyticsData.customers.new?.toLocaleString() || 0}`);
    }
    lines.push('');
  }

  if (sections.includes('insights')) {
    if (format === 'markdown') {
      lines.push('## Key Insights');
    } else {
      lines.push('KEY INSIGHTS');
      lines.push('─'.repeat(50));
    }
    lines.push('');

    const revenue = analyticsData.revenue;
    if (revenue && revenue.growth) {
      if (revenue.growth > 0) {
        lines.push(`✅ Revenue increased by ${revenue.growth.toFixed(1)}% during this period.`);
      } else {
        lines.push(`⚠️ Revenue decreased by ${Math.abs(revenue.growth).toFixed(1)}% during this period.`);
      }
    }
    lines.push('');
  }

  if (sections.includes('recommendations')) {
    if (format === 'markdown') {
      lines.push('## Recommendations');
    } else {
      lines.push('RECOMMENDATIONS');
      lines.push('─'.repeat(50));
    }
    lines.push('');
    lines.push('1. Continue monitoring key metrics regularly');
    lines.push('2. Focus on customer retention strategies');
    lines.push('3. Optimize marketing campaigns based on segment performance');
    lines.push('');
  }

  return {
    report: lines.join('\n'),
    format,
    sections,
    generatedAt: new Date().toISOString(),
  };
}

