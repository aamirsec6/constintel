// GENERATOR: INTEGRATIONS
// ASSUMPTIONS: Twilio WhatsApp API, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN in env
// HOW TO RUN: Use via /api/integrations/twilio/webhook route
// DOCS: https://www.twilio.com/docs/whatsapp/api

import crypto from 'crypto';
import { ingestEvent } from '../ingestion/eventIngestion';

export interface TwilioWebhookPayload {
  MessageSid?: string;
  AccountSid?: string;
  From?: string; // WhatsApp number (e.g., whatsapp:+1234567890)
  To?: string; // Your WhatsApp business number
  Body?: string;
  MessageStatus?: string;
  NumMedia?: string;
  [key: string]: any;
}

/**
 * Verify Twilio webhook signature
 * Docs: https://www.twilio.com/docs/usage/webhooks/webhooks-security
 */
export function verifyTwilioWebhook(
  url: string,
  params: Record<string, string>,
  signature: string,
  authToken: string
): boolean {
  if (!signature || !authToken) {
    return false;
  }

  // Sort parameters and create signature string
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}${params[key]}`)
    .join('');

  const signatureString = url + sortedParams;
  const hash = crypto.createHmac('sha1', authToken).update(signatureString).digest('base64');

  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
}

/**
 * Extract WhatsApp number from Twilio format (whatsapp:+1234567890 -> +1234567890)
 */
export function extractWhatsAppNumber(from: string): string | undefined {
  if (!from) return undefined;
  // Remove 'whatsapp:' prefix if present
  return from.replace(/^whatsapp:/, '');
}

/**
 * Transform Twilio webhook payload to our event format
 */
export function transformTwilioEvent(
  payload: TwilioWebhookPayload
): { eventType: string; normalizedPayload: any } {
  const whatsappNumber = extractWhatsAppNumber(payload.From || '');

  const normalizedPayload: any = {
    ...payload,
    whatsapp: whatsappNumber,
    phone: whatsappNumber?.replace(/^\+/, ''), // Remove + for phone matching
    message_body: payload.Body,
    message_sid: payload.MessageSid,
    source: 'twilio_whatsapp',
  };

  // Determine event type based on message content or status
  let eventType = 'whatsapp_message';
  if (payload.MessageStatus === 'delivered') {
    eventType = 'whatsapp_message_delivered';
  } else if (payload.MessageStatus === 'read') {
    eventType = 'whatsapp_message_read';
  }

  // Detect intent from message body (simple keyword matching)
  const body = (payload.Body || '').toLowerCase();
  if (body.includes('order') || body.includes('purchase') || body.includes('buy')) {
    eventType = 'whatsapp_purchase_intent';
  } else if (body.includes('support') || body.includes('help')) {
    eventType = 'whatsapp_support_request';
  }

  return { eventType, normalizedPayload };
}

/**
 * Process Twilio WhatsApp webhook
 */
export async function processTwilioWebhook(
  brandId: string,
  payload: TwilioWebhookPayload
): Promise<{ success: boolean; eventId?: string; profileId?: string }> {
  try {
    const { eventType, normalizedPayload } = transformTwilioEvent(payload);

    const result = await ingestEvent({
      brandId,
      eventType,
      payload: normalizedPayload,
    });

    return {
      success: true,
      eventId: result.eventId,
      profileId: result.profileId || undefined,
    };
  } catch (error) {
    console.error('Error processing Twilio webhook:', error);
    throw error;
  }
}

/**
 * Send WhatsApp message via Twilio (for responses)
 * Note: Requires Twilio SDK - add to package.json: "twilio": "^4.19.0"
 */
export async function sendWhatsAppMessage(
  to: string,
  message: string,
  from?: string
): Promise<{ success: boolean; messageSid?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = from || process.env.TWILIO_WHATSAPP_FROM;

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error('Twilio credentials not configured');
  }

  // Dynamic import to avoid requiring twilio package if not installed
  try {
    const twilio = require('twilio');
    const client = twilio(accountSid, authToken);

    // Ensure number is in correct format
    const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    const fromNumberFormatted = fromNumber.startsWith('whatsapp:')
      ? fromNumber
      : `whatsapp:${fromNumber}`;

    const messageResult = await client.messages.create({
      body: message,
      from: fromNumberFormatted,
      to: toNumber,
    });

    return {
      success: true,
      messageSid: messageResult.sid,
    };
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw error;
  }
}

