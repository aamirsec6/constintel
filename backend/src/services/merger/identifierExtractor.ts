// GENERATOR: FULL_PLATFORM
// ASSUMPTIONS: Event payloads contain identifiers in various formats
// HOW TO RUN: import { extractIdentifiers } from './identifierExtractor'

export interface ExtractedIdentifiers {
  phone?: string;
  email?: string;
  loyalty_id?: string;
  qr_id?: string;
  whatsapp?: string;
  upi?: string;
  card_last4?: string;
  device_id?: string;
  cookie_id?: string;
}

/**
 * Extract identifiers from event payload
 * Handles various payload structures defensively
 */
export function extractIdentifiers(payload: any): ExtractedIdentifiers {
  const identifiers: ExtractedIdentifiers = {};

  if (!payload || typeof payload !== 'object') {
    return identifiers;
  }

  // Direct fields
  if (payload.phone) identifiers.phone = normalizePhone(payload.phone);
  if (payload.email) identifiers.email = normalizeEmail(payload.email);
  if (payload.loyalty_id) identifiers.loyalty_id = String(payload.loyalty_id);
  if (payload.qr_id) identifiers.qr_id = String(payload.qr_id);
  if (payload.whatsapp) identifiers.whatsapp = normalizePhone(payload.whatsapp);
  if (payload.upi) identifiers.upi = String(payload.upi);
  if (payload.card_last4) identifiers.card_last4 = String(payload.card_last4).slice(-4);
  if (payload.device_id) identifiers.device_id = String(payload.device_id);
  if (payload.cookie_id) identifiers.cookie_id = String(payload.cookie_id);

  // Nested customer object
  if (payload.customer) {
    const cust = payload.customer;
    if (cust.phone && !identifiers.phone) identifiers.phone = normalizePhone(cust.phone);
    if (cust.email && !identifiers.email) identifiers.email = normalizeEmail(cust.email);
    if (cust.loyalty_id && !identifiers.loyalty_id) identifiers.loyalty_id = String(cust.loyalty_id);
  }

  // Nested billing/shipping
  if (payload.billing) {
    const billing = payload.billing;
    if (billing.phone && !identifiers.phone) identifiers.phone = normalizePhone(billing.phone);
    if (billing.email && !identifiers.email) identifiers.email = normalizeEmail(billing.email);
  }

  // Shopify format
  if (payload.contact_email) identifiers.email = normalizeEmail(payload.contact_email);
  if (payload.phone) identifiers.phone = normalizePhone(payload.phone);

  return identifiers;
}

function normalizePhone(phone: string | number): string | undefined {
  if (!phone) return undefined;
  const cleaned = String(phone).replace(/\D/g, '');
  if (cleaned.length < 10) return undefined;
  return cleaned;
}

function normalizeEmail(email: string): string | undefined {
  if (!email || typeof email !== 'string') return undefined;
  const trimmed = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return undefined;
  return trimmed;
}

