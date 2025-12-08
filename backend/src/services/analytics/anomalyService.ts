// GENERATOR: OLLAMA_INTEGRATION
// Anomaly detection and explanation service
// ASSUMPTIONS: ML service LLM endpoints available for explanations
// HOW TO USE: import { detectAnomalies, explainAnomaly } from './anomalyService'

import axios from 'axios';
import { getPrismaClient } from '../../db/prismaClient';
import { getRedisClient } from '../redis/redisClient';

const prisma = getPrismaClient();
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || process.env.NEXT_PUBLIC_ML_API_URL || 'http://localhost:8000';
const LLM_ENABLED = process.env.ENABLE_ANOMALY_DETECTION === 'true';

export interface Anomaly {
  date: string;
  metric: string;
  value: number;
  expected: number;
  deviation: number;
  explanation?: string;
  type: 'spike' | 'drop' | 'unusual';
}

/**
 * Detect anomalies in time-series data
 */
export async function detectAnomalies(
  brandId: string,
  metric: 'revenue' | 'orders' | 'customers',
  startDate: Date,
  endDate: Date
): Promise<Anomaly[]> {
  // Get time-series data
  const events = await prisma.customerRawEvent.findMany({
    where: {
      brandId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      createdAt: true,
      payload: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  // Aggregate by day
  const dailyData: Record<string, number> = {};
  
  events.forEach(event => {
    const date = event.createdAt.toISOString().split('T')[0];
    let value = 0;

    if (metric === 'revenue') {
      value = parseFloat(event.payload?.total?.toString() || '0') || 0;
    } else if (metric === 'orders') {
      if (event.payload?.event_type === 'purchase' || event.payload?.event_type === 'pos_transaction') {
        value = 1;
      }
    } else if (metric === 'customers') {
      if (event.payload?.event_type === 'customer_created') {
        value = 1;
      }
    }

    if (dailyData[date]) {
      dailyData[date] += value;
    } else {
      dailyData[date] = value;
    }
  });

  // Calculate statistics
  const values = Object.values(dailyData);
  if (values.length === 0) {
    return [];
  }

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  // Threshold: 2 standard deviations
  const threshold = 2 * stdDev;
  const anomalies: Anomaly[] = [];

  // Detect anomalies
  for (const [date, value] of Object.entries(dailyData)) {
    const deviation = ((value - mean) / mean) * 100;
    const zScore = Math.abs((value - mean) / (stdDev || 1));

    if (zScore > 2) {
      anomalies.push({
        date,
        metric,
        value,
        expected: mean,
        deviation,
        type: value > mean ? 'spike' : 'drop',
      });
    }
  }

  return anomalies.sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation));
}

/**
 * Explain an anomaly using LLM
 */
export async function explainAnomaly(
  brandId: string,
  anomaly: Anomaly,
  contextData?: any
): Promise<string> {
  if (!LLM_ENABLED) {
    return getFallbackExplanation(anomaly);
  }

  try {
    const response = await axios.post(`${ML_SERVICE_URL}/llm/explain-anomaly`, {
      anomaly: {
        date: anomaly.date,
        metric: anomaly.metric,
        value: anomaly.value,
        expected: anomaly.expected,
        deviation: anomaly.deviation,
        type: anomaly.type,
      },
      context: contextData || {},
    }, {
      timeout: 30000,
    });

    if (response.data.success && response.data.data?.explanation) {
      return response.data.data.explanation;
    }

    return getFallbackExplanation(anomaly);
  } catch (error: any) {
    console.error('Error explaining anomaly:', error.message);
    return getFallbackExplanation(anomaly);
  }
}

/**
 * Get all anomalies with explanations for a date range
 */
export async function getAnomaliesWithExplanations(
  brandId: string,
  startDate: Date,
  endDate: Date,
  metric?: 'revenue' | 'orders' | 'customers'
): Promise<Anomaly[]> {
  const metrics = metric ? [metric] : ['revenue', 'orders', 'customers'];
  const allAnomalies: Anomaly[] = [];

  for (const m of metrics) {
    const anomalies = await detectAnomalies(brandId, m, startDate, endDate);
    
    // Add explanations
    for (const anomaly of anomalies) {
      if (!anomaly.explanation) {
        anomaly.explanation = await explainAnomaly(brandId, anomaly);
      }
      allAnomalies.push(anomaly);
    }
  }

  return allAnomalies.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Generate fallback explanation when LLM is unavailable
 */
function getFallbackExplanation(anomaly: Anomaly): string {
  const deviationPercent = Math.abs(anomaly.deviation).toFixed(1);
  
  if (anomaly.type === 'spike') {
    return `${anomaly.metric.charAt(0).toUpperCase() + anomaly.metric.slice(1)} spike detected on ${anomaly.date}: ` +
           `This is ${deviationPercent}% higher than expected. This could be due to a marketing campaign, ` +
           `seasonal event, or other external factor.`;
  } else {
    return `${anomaly.metric.charAt(0).toUpperCase() + anomaly.metric.slice(1)} drop detected on ${anomaly.date}: ` +
           `This is ${deviationPercent}% lower than expected. Consider investigating potential issues ` +
           `such as technical problems, competitive factors, or market conditions.`;
  }
}

