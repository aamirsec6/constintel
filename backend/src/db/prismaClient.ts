// GENERATOR: FULL_PLATFORM
// ASSUMPTIONS: Prisma schema exists at ../prisma/schema.prisma, DATABASE_URL in env
// HOW TO RUN: Import and use: const prisma = getPrismaClient()

import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    log: ['error', 'warn'],
  });
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
    });
  }
  prisma = global.__prisma;
}

export function getPrismaClient(): PrismaClient {
  return prisma;
}

export default prisma;

