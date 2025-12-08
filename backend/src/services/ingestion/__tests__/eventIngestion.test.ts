// GENERATOR: FULL_PLATFORM
// Unit tests for event ingestion (mocked)
// HOW TO RUN: npm test -- eventIngestion

import { extractIdentifiers } from '../../merger/identifierExtractor';

// Mock Prisma client
jest.mock('../../../db/prismaClient', () => ({
  getPrismaClient: jest.fn(() => ({
    customerProfile: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    customerRawEvent: {
      create: jest.fn(),
    },
  })),
}));

describe('Event Ingestion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should extract identifiers correctly', () => {
    const payload = {
      phone: '1234567890',
      email: 'test@example.com',
      customer: {
        loyalty_id: 'LOY123',
      },
    };

    const identifiers = extractIdentifiers(payload);

    expect(identifiers.phone).toBe('1234567890');
    expect(identifiers.email).toBe('test@example.com');
    expect(identifiers.loyalty_id).toBe('LOY123');
  });

  // Note: Full integration tests would require a test database
  // These are unit tests for the identifier extraction logic
});

