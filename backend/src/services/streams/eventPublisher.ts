// GENERATOR: REDIS_STREAMS
// ASSUMPTIONS: Redis Streams service available
// HOW TO RUN: Import and use: publishRawEvent(), publishNormalizedEvent()
// TODO: Add retry logic and dead letter queue for failed publishes

import { publishToStream, STREAM_TOPICS } from './redisStreams';

export interface RawEventData {
  eventId: string;
  brandId: string;
  eventType: string;
  payload: any;
  timestamp: string;
}

export interface NormalizedEventData {
  eventId: string;
  brandId: string;
  eventType: string;
  profileId: string | null;
  identifiers: Record<string, string>;
  normalizedPayload: any;
  timestamp: string;
}

/**
 * Publish raw event to events.raw stream
 */
export async function publishRawEvent(data: RawEventData): Promise<string> {
  try {
    const streamData = {
      event_id: data.eventId,
      brand_id: data.brandId,
      event_type: data.eventType,
      payload: JSON.stringify(data.payload),
      timestamp: data.timestamp,
    };

    const messageId = await publishToStream(STREAM_TOPICS.EVENTS_RAW, streamData, {
      maxLength: 10000, // Keep last 10k events
    });

    console.log(`📤 Published raw event ${data.eventId} to ${STREAM_TOPICS.EVENTS_RAW} (message ID: ${messageId})`);
    return messageId;
  } catch (error) {
    console.error(`Error publishing raw event ${data.eventId}:`, error);
    throw error;
  }
}

/**
 * Publish normalized event to events.normalized stream
 */
export async function publishNormalizedEvent(data: NormalizedEventData): Promise<string> {
  try {
    const streamData = {
      event_id: data.eventId,
      brand_id: data.brandId,
      event_type: data.eventType,
      profile_id: data.profileId || '',
      identifiers: JSON.stringify(data.identifiers),
      normalized_payload: JSON.stringify(data.normalizedPayload),
      timestamp: data.timestamp,
    };

    const messageId = await publishToStream(STREAM_TOPICS.EVENTS_NORMALIZED, streamData, {
      maxLength: 10000, // Keep last 10k events
    });

    console.log(`📤 Published normalized event ${data.eventId} to ${STREAM_TOPICS.EVENTS_NORMALIZED} (message ID: ${messageId})`);
    return messageId;
  } catch (error) {
    console.error(`Error publishing normalized event ${data.eventId}:`, error);
    throw error;
  }
}

/**
 * Publish merge request to profiles.merge_requests stream
 */
export async function publishMergeRequest(data: {
  brandId: string;
  profileIds: string[];
  reason: string;
  requiresManualReview: boolean;
}): Promise<string> {
  try {
    const streamData = {
      brand_id: data.brandId,
      profile_ids: JSON.stringify(data.profileIds),
      reason: data.reason,
      requires_manual_review: data.requiresManualReview.toString(),
      timestamp: new Date().toISOString(),
    };

    const messageId = await publishToStream(STREAM_TOPICS.PROFILES_MERGE_REQUESTS, streamData, {
      maxLength: 1000, // Keep last 1k merge requests
    });

    console.log(`📤 Published merge request for profiles ${data.profileIds.join(', ')} to ${STREAM_TOPICS.PROFILES_MERGE_REQUESTS} (message ID: ${messageId})`);
    return messageId;
  } catch (error) {
    console.error(`Error publishing merge request:`, error);
    throw error;
  }
}

/**
 * Publish prediction request to predictions.requests stream
 */
export async function publishPredictionRequest(data: {
  profileId: string;
  brandId: string;
  requestType: 'churn' | 'ltv' | 'segment' | 'all';
}): Promise<string> {
  try {
    const streamData = {
      profile_id: data.profileId,
      brand_id: data.brandId,
      request_type: data.requestType,
      timestamp: new Date().toISOString(),
    };

    const messageId = await publishToStream(STREAM_TOPICS.PREDICTIONS_REQUESTS, streamData, {
      maxLength: 5000, // Keep last 5k prediction requests
    });

    return messageId;
  } catch (error) {
    console.error(`Error publishing prediction request:`, error);
    throw error;
  }
}

