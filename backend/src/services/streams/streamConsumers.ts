// GENERATOR: REDIS_STREAMS
// ASSUMPTIONS: Redis Streams service available, consumer groups created
// HOW TO RUN: Start consumer workers: startEventProcessor(), startMergeProcessor()
// TODO: Add proper error handling, retry logic, and monitoring

import {
  readFromStreamBlocking,
  acknowledgeMessage,
  createConsumerGroup,
  getPendingMessages,
  claimPendingMessages,
  STREAM_TOPICS,
} from './redisStreams';
import { getPrismaClient } from '../../db/prismaClient';

const prisma = getPrismaClient();

// Consumer group names
const CONSUMER_GROUPS = {
  EVENT_PROCESSOR: 'event-processors',
  MERGE_PROCESSOR: 'merge-processors',
  PREDICTION_PROCESSOR: 'prediction-processors',
} as const;

// Consumer names (unique per instance)
const CONSUMER_NAME = `consumer-${process.pid}-${Date.now()}`;

/**
 * Initialize consumer groups for all streams
 */
export async function initializeConsumerGroups(): Promise<void> {
  try {
    await createConsumerGroup(STREAM_TOPICS.EVENTS_NORMALIZED, CONSUMER_GROUPS.EVENT_PROCESSOR);
    await createConsumerGroup(STREAM_TOPICS.PROFILES_MERGE_REQUESTS, CONSUMER_GROUPS.MERGE_PROCESSOR);
    await createConsumerGroup(STREAM_TOPICS.PREDICTIONS_REQUESTS, CONSUMER_GROUPS.PREDICTION_PROCESSOR);
    console.log('✅ Consumer groups initialized');
  } catch (error) {
    console.error('Error initializing consumer groups:', error);
    throw error;
  }
}

/**
 * Process normalized events from stream
 * This can trigger feature building, ML predictions, etc.
 */
export async function processNormalizedEvent(
  messageId: string,
  fields: Record<string, string>
): Promise<void> {
  try {
    const eventId = fields.event_id;
    const profileId = fields.profile_id;
    const eventType = fields.event_type;

    // Example: Update profile last seen, trigger feature rebuild, etc.
    if (profileId) {
      // Update profile updated_at (triggers on update)
      await prisma.customerProfile.update({
        where: { id: profileId },
        data: { updatedAt: new Date() },
      });

      // In future: Trigger feature rebuild, ML prediction request, etc.
      console.log(`✅ Processed normalized event ${eventId} for profile ${profileId}`);
    }

    // Acknowledge message
    await acknowledgeMessage(
      STREAM_TOPICS.EVENTS_NORMALIZED,
      CONSUMER_GROUPS.EVENT_PROCESSOR,
      messageId
    );
  } catch (error) {
    console.error(`Error processing normalized event ${fields.event_id}:`, error);
    // Don't acknowledge - will be retried
    throw error;
  }
}

/**
 * Process merge requests from stream
 */
export async function processMergeRequest(
  messageId: string,
  fields: Record<string, string>
): Promise<void> {
  try {
    const profileIds = JSON.parse(fields.profile_ids || '[]') as string[];
    const reason = fields.reason;
    const requiresManualReview = fields.requires_manual_review === 'true';

    if (requiresManualReview) {
      // Create manual merge queue entry
      await prisma.manualMergeQueue.create({
        data: {
          profileIds,
          reason,
          status: 'pending',
        },
      });
      console.log(`📋 Created manual merge queue entry for profiles: ${profileIds.join(', ')}`);
    }

    // Acknowledge message
    await acknowledgeMessage(
      STREAM_TOPICS.PROFILES_MERGE_REQUESTS,
      CONSUMER_GROUPS.MERGE_PROCESSOR,
      messageId
    );
  } catch (error) {
    console.error(`Error processing merge request:`, error);
    throw error;
  }
}

/**
 * Process prediction requests from stream
 */
export async function processPredictionRequest(
  messageId: string,
  fields: Record<string, string>
): Promise<void> {
  try {
    const profileId = fields.profile_id;
    const requestType = fields.request_type;

    // In future: Call ML service to get predictions
    // For now, just log
    console.log(`🔮 Prediction request for profile ${profileId}, type: ${requestType}`);

    // Acknowledge message
    await acknowledgeMessage(
      STREAM_TOPICS.PREDICTIONS_REQUESTS,
      CONSUMER_GROUPS.PREDICTION_PROCESSOR,
      messageId
    );
  } catch (error) {
    console.error(`Error processing prediction request:`, error);
    throw error;
  }
}

/**
 * Start event processor worker
 */
export async function startEventProcessor(): Promise<void> {
  console.log(`🚀 Starting event processor worker: ${CONSUMER_NAME}`);
  
  while (true) {
    try {
      const messages = await readFromStreamBlocking(
        STREAM_TOPICS.EVENTS_NORMALIZED,
        CONSUMER_GROUPS.EVENT_PROCESSOR,
        CONSUMER_NAME,
        5000, // Block for 5 seconds
        10    // Read up to 10 messages
      );

      for (const message of messages) {
        await processNormalizedEvent(message.id, message.fields);
      }

      // Process any pending messages (from failed consumers)
      const pending = await getPendingMessages(
        STREAM_TOPICS.EVENTS_NORMALIZED,
        CONSUMER_GROUPS.EVENT_PROCESSOR,
        10
      );

      if (pending.length > 0) {
        const claimed = await claimPendingMessages(
          STREAM_TOPICS.EVENTS_NORMALIZED,
          CONSUMER_GROUPS.EVENT_PROCESSOR,
          CONSUMER_NAME,
          60000, // 1 minute idle time
          10
        );

        for (const message of claimed) {
          await processNormalizedEvent(message.id, message.fields);
        }
      }
    } catch (error) {
      console.error('Error in event processor:', error);
      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

/**
 * Start merge processor worker
 */
export async function startMergeProcessor(): Promise<void> {
  console.log(`🚀 Starting merge processor worker: ${CONSUMER_NAME}`);
  
  while (true) {
    try {
      const messages = await readFromStreamBlocking(
        STREAM_TOPICS.PROFILES_MERGE_REQUESTS,
        CONSUMER_GROUPS.MERGE_PROCESSOR,
        CONSUMER_NAME,
        5000,
        10
      );

      for (const message of messages) {
        await processMergeRequest(message.id, message.fields);
      }
    } catch (error) {
      console.error('Error in merge processor:', error);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

/**
 * Start prediction processor worker
 */
export async function startPredictionProcessor(): Promise<void> {
  console.log(`🚀 Starting prediction processor worker: ${CONSUMER_NAME}`);
  
  while (true) {
    try {
      const messages = await readFromStreamBlocking(
        STREAM_TOPICS.PREDICTIONS_REQUESTS,
        CONSUMER_GROUPS.PREDICTION_PROCESSOR,
        CONSUMER_NAME,
        5000,
        10
      );

      for (const message of messages) {
        await processPredictionRequest(message.id, message.fields);
      }
    } catch (error) {
      console.error('Error in prediction processor:', error);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

