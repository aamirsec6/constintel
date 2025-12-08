// GENERATOR: FULL_PLATFORM
// Unit tests for identifier extractor
// HOW TO RUN: npm test -- identifierExtractor

import { extractIdentifiers } from '../identifierExtractor';

describe('extractIdentifiers', () => {
  it('should extract phone and email from direct fields', () => {
    const payload = {
      phone: '1234567890',
      email: 'test@example.com',
    };

    const result = extractIdentifiers(payload);

    expect(result.phone).toBe('1234567890');
    expect(result.email).toBe('test@example.com');
  });

  it('should extract from nested customer object', () => {
    const payload = {
      customer: {
        phone: '9876543210',
        email: 'customer@example.com',
        loyalty_id: 'LOY123',
      },
    };

    const result = extractIdentifiers(payload);

    expect(result.phone).toBe('9876543210');
    expect(result.email).toBe('customer@example.com');
    expect(result.loyalty_id).toBe('LOY123');
  });

  it('should extract from billing object', () => {
    const payload = {
      billing: {
        phone: '5551234567',
        email: 'billing@example.com',
      },
    };

    const result = extractIdentifiers(payload);

    expect(result.phone).toBe('5551234567');
    expect(result.email).toBe('billing@example.com');
  });

  it('should normalize phone numbers (remove non-digits)', () => {
    const payload = {
      phone: '+1 (555) 123-4567',
    };

    const result = extractIdentifiers(payload);

    expect(result.phone).toBe('15551234567');
  });

  it('should normalize email (lowercase, trim)', () => {
    const payload = {
      email: '  Test@Example.COM  ',
    };

    const result = extractIdentifiers(payload);

    expect(result.email).toBe('test@example.com');
  });

  it('should extract card_last4 correctly', () => {
    const payload = {
      card_last4: '1234567890123456',
    };

    const result = extractIdentifiers(payload);

    expect(result.card_last4).toBe('3456');
  });

  it('should handle empty/null payloads', () => {
    expect(extractIdentifiers(null)).toEqual({});
    expect(extractIdentifiers(undefined)).toEqual({});
    expect(extractIdentifiers({})).toEqual({});
  });

  it('should handle invalid email formats', () => {
    const payload = {
      email: 'not-an-email',
    };

    const result = extractIdentifiers(payload);

    expect(result.email).toBeUndefined();
  });

  it('should handle Shopify format', () => {
    const payload = {
      contact_email: 'shopify@example.com',
      phone: '1234567890',
    };

    const result = extractIdentifiers(payload);

    expect(result.email).toBe('shopify@example.com');
    expect(result.phone).toBe('1234567890');
  });
});

