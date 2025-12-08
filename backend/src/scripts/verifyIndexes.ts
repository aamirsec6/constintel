// GENERATOR: PHASE1_WEEK1_PERFORMANCE_OPTIMIZATION
// Verify database indexes are created and report status
// HOW TO RUN: npx tsx src/scripts/verifyIndexes.ts

import { getPrismaClient } from '../db/prismaClient';

const prisma = getPrismaClient();

async function verifyIndexes() {
  console.log('🔍 Verifying database indexes...\n');

  const indexes = [
    {
      name: 'idx_customer_profile_identifiers_gin',
      table: 'customer_profile',
      description: 'GIN index on identifiers JSONB column',
      critical: true,
    },
    {
      name: 'idx_customer_profile_updated_at',
      table: 'customer_profile',
      description: 'Index on updated_at for recent activity queries',
      critical: false,
    },
    {
      name: 'idx_customer_profile_ltv',
      table: 'customer_profile',
      description: 'Index on lifetime_value for high-value customer queries',
      critical: false,
    },
    {
      name: 'idx_customer_profile_strength_brand',
      table: 'customer_profile',
      description: 'Composite index for profile strength queries',
      critical: false,
    },
    {
      name: 'idx_customer_raw_event_brand_created_desc',
      table: 'customer_raw_event',
      description: 'Index for time-based event queries',
      critical: false,
    },
    {
      name: 'idx_predictions_segment',
      table: 'predictions',
      description: 'Index for segment-based queries',
      critical: false,
    },
    {
      name: 'idx_predictions_churn',
      table: 'predictions',
      description: 'Index for churn risk queries',
      critical: false,
    },
  ];

  const results: Array<{ name: string; exists: boolean; critical: boolean }> = [];

  for (const index of indexes) {
    try {
      const result = await prisma.$queryRaw<Array<{ indexname: string }>>`
        SELECT indexname 
        FROM pg_indexes 
        WHERE schemaname = 'public' 
          AND tablename = ${index.table}
          AND indexname = ${index.name}
      `;

      const exists = result.length > 0;
      results.push({ name: index.name, exists, critical: index.critical });

      const status = exists ? '✅' : '❌';
      const critical = index.critical ? ' (CRITICAL)' : '';
      console.log(`${status} ${index.name}${critical}`);
      console.log(`   ${index.description}`);
    } catch (error: any) {
      console.error(`❌ Error checking ${index.name}: ${error.message}`);
      results.push({ name: index.name, exists: false, critical: index.critical });
    }
  }

  console.log('\n📊 Summary:');
  const existing = results.filter(r => r.exists).length;
  const missing = results.filter(r => !r.exists).length;
  const criticalMissing = results.filter(r => !r.exists && r.critical).length;

  console.log(`   Total indexes: ${results.length}`);
  console.log(`   ✅ Existing: ${existing}`);
  console.log(`   ❌ Missing: ${missing}`);
  if (criticalMissing > 0) {
    console.log(`   ⚠️  Critical missing: ${criticalMissing}`);
  }

  if (missing > 0) {
    console.log('\n💡 To create missing indexes, run:');
    console.log('   npx prisma migrate dev');
    console.log('\n   Or apply the migration manually:');
    console.log('   psql $DATABASE_URL -f prisma/migrations/20251208000000_add_performance_indexes/migration.sql');
  } else {
    console.log('\n✅ All indexes are in place!');
  }

  await prisma.$disconnect();
}

verifyIndexes().catch(console.error);

