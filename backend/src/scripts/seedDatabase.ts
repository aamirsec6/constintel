// GENERATOR: SANDBOX
// ASSUMPTIONS: Prisma client, database connected, DATABASE_URL in env
// HOW TO RUN: npm run seed or tsx src/scripts/seedDatabase.ts
// This is a convenience wrapper - the actual script is generateTestData.ts

// Re-export the main function
export * from './generateTestData';

// If run directly, import and run the main script
if (require.main === module) {
  require('./generateTestData');
}

