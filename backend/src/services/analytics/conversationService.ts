// GENERATOR: SIRI_LIKE_LLM
// Conversation session management for Siri-like LLM
// ASSUMPTIONS: Redis available, session-based conversations
// HOW TO USE: import { getConversation, addMessage, createSession } from './conversationService'

import { getRedisClient } from '../redis/redisClient';
import { randomUUID } from 'crypto';

const CONVERSATION_TTL = parseInt(process.env.CONVERSATION_SESSION_TTL || '86400', 10); // 24 hours default
const MAX_HISTORY = parseInt(process.env.MAX_CONVERSATION_HISTORY || '20', 10);

export interface ConversationMessage {
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: Array<{
    metric: string;
    value: number;
    period: string;
    description?: string;
  }>;
  confidence?: number;
}

export interface ConversationSession {
  sessionId: string;
  brandId: string;
  messages: ConversationMessage[];
  contextSummary: string; // Brief summary of what's been discussed
  discussedMetrics: string[]; // Metrics that have been discussed
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Generate conversation cache key
 */
function getConversationKey(brandId: string, sessionId: string): string {
  return `conversation:${brandId}:${sessionId}`;
}

/**
 * Create a new conversation session
 */
export async function createSession(brandId: string): Promise<string> {
  const sessionId = randomUUID();
  const session: ConversationSession = {
    sessionId,
    brandId,
    messages: [],
    contextSummary: '',
    discussedMetrics: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  try {
    const redis = await getRedisClient();
    await redis.setEx(
      getConversationKey(brandId, sessionId),
      CONVERSATION_TTL,
      JSON.stringify(session)
    );
    return sessionId;
  } catch (error) {
    console.warn('Failed to create conversation session in Redis:', error);
    // Return sessionId anyway - will work with in-memory fallback
    return sessionId;
  }
}

/**
 * Get conversation session
 */
export async function getConversation(
  brandId: string,
  sessionId: string
): Promise<ConversationSession | null> {
  try {
    const redis = await getRedisClient();
    const cached = await redis.get(getConversationKey(brandId, sessionId));
    
    if (cached) {
      const session = JSON.parse(cached) as ConversationSession;
      // Convert date strings back to Date objects
      session.createdAt = new Date(session.createdAt);
      session.updatedAt = new Date(session.updatedAt);
      session.messages = session.messages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));
      return session;
    }
    
    return null;
  } catch (error) {
    console.warn('Failed to get conversation from Redis:', error);
    return null;
  }
}

/**
 * Add a message to the conversation
 */
export async function addMessage(
  brandId: string,
  sessionId: string,
  message: ConversationMessage
): Promise<ConversationSession> {
  let session = await getConversation(brandId, sessionId);
  
  if (!session) {
    // Create new session if it doesn't exist
    session = {
      sessionId,
      brandId,
      messages: [],
      contextSummary: '',
      discussedMetrics: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  // Add message
  session.messages.push(message);
  
  // Limit message history
  if (session.messages.length > MAX_HISTORY) {
    session.messages = session.messages.slice(-MAX_HISTORY);
  }

  // Update context summary (simplified - could be enhanced with LLM)
  if (message.type === 'user') {
    // Extract discussed metrics from user message
    const metricKeywords = ['revenue', 'orders', 'customers', 'segment', 'growth', 'churn', 'ltv'];
    metricKeywords.forEach(keyword => {
      if (message.content.toLowerCase().includes(keyword) && !session.discussedMetrics.includes(keyword)) {
        session.discussedMetrics.push(keyword);
      }
    });
  }

  session.updatedAt = new Date();

  try {
    const redis = await getRedisClient();
    await redis.setEx(
      getConversationKey(brandId, sessionId),
      CONVERSATION_TTL,
      JSON.stringify(session)
    );
  } catch (error) {
    console.warn('Failed to save conversation to Redis:', error);
  }

  return session;
}

/**
 * Get conversation history formatted for LLM context
 */
export async function getConversationHistory(
  brandId: string,
  sessionId: string
): Promise<string> {
  const session = await getConversation(brandId, sessionId);
  
  if (!session || session.messages.length === 0) {
    return '';
  }

  // Format last N messages for context (keep it concise)
  const recentMessages = session.messages.slice(-10);
  
  return recentMessages
    .map(msg => {
      const role = msg.type === 'user' ? 'User' : 'Assistant';
      return `${role}: ${msg.content}`;
    })
    .join('\n\n');
}

/**
 * Update context summary (can be enhanced with LLM summarization)
 */
export async function updateContextSummary(
  brandId: string,
  sessionId: string,
  summary: string
): Promise<void> {
  const session = await getConversation(brandId, sessionId);
  
  if (!session) {
    return;
  }

  session.contextSummary = summary;
  session.updatedAt = new Date();

  try {
    const redis = await getRedisClient();
    await redis.setEx(
      getConversationKey(brandId, sessionId),
      CONVERSATION_TTL,
      JSON.stringify(session)
    );
  } catch (error) {
    console.warn('Failed to update context summary:', error);
  }
}

/**
 * Clear conversation session
 */
export async function clearSession(brandId: string, sessionId: string): Promise<void> {
  try {
    const redis = await getRedisClient();
    await redis.del(getConversationKey(brandId, sessionId));
  } catch (error) {
    console.warn('Failed to clear conversation session:', error);
  }
}

