// GENERATOR: FULL_PLATFORM
// ASSUMPTIONS: Prisma client, database connected
// HOW TO RUN: tsx src/scripts/checkDatabase.ts

import { getPrismaClient } from '../db/prismaClient';

const prisma = getPrismaClient();

async function checkDatabase() {
  console.log('📊 Checking Database Status...');
  console.log('');

  try {
    const counts = {
      brands: await prisma.brand.count(),
      users: await prisma.user.count(),
      customerProfiles: await prisma.customerProfile.count(),
      customerRawEvents: await prisma.customerRawEvent.count(),
      products: await prisma.product.count(),
      inventory: await prisma.inventory.count(),
      campaigns: await prisma.campaign.count(),
      campaignExecutions: await prisma.campaignExecution.count(),
      marketingAutomations: await prisma.marketingAutomation.count(),
      automationExecutions: await prisma.automationExecution.count(),
      productIntents: await prisma.productIntent.count(),
      storeVisits: await prisma.storeVisit.count(),
      inStoreAlerts: await prisma.inStoreAlert.count(),
      customerJourneys: await prisma.customerJourney.count(),
      attributions: await prisma.attribution.count(),
      predictions: await prisma.prediction.count(),
      features: await prisma.feature.count(),
      mergeHistory: await prisma.mergeHistory.count(),
      manualMergeQueue: await prisma.manualMergeQueue.count(),
      brandMetrics: await prisma.brandMetrics.count(),
      brandMetricsHistory: await prisma.brandMetricsHistory.count(),
      modelVersions: await prisma.modelVersion.count(),
    };

    console.log('📈 Record Counts:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Brands:                    ${counts.brands}`);
    console.log(`   Users:                     ${counts.users}`);
    console.log(`   Customer Profiles:         ${counts.customerProfiles}`);
    console.log(`   Customer Raw Events:       ${counts.customerRawEvents}`);
    console.log(`   Products:                  ${counts.products}`);
    console.log(`   Inventory:                 ${counts.inventory}`);
    console.log(`   Campaigns:                 ${counts.campaigns}`);
    console.log(`   Campaign Executions:       ${counts.campaignExecutions}`);
    console.log(`   Marketing Automations:     ${counts.marketingAutomations}`);
    console.log(`   Automation Executions:     ${counts.automationExecutions}`);
    console.log(`   Product Intents:           ${counts.productIntents}`);
    console.log(`   Store Visits:              ${counts.storeVisits}`);
    console.log(`   In-Store Alerts:           ${counts.inStoreAlerts}`);
    console.log(`   Customer Journeys:         ${counts.customerJourneys}`);
    console.log(`   Attributions:              ${counts.attributions}`);
    console.log(`   Predictions:               ${counts.predictions}`);
    console.log(`   Features:                  ${counts.features}`);
    console.log(`   Merge History:             ${counts.mergeHistory}`);
    console.log(`   Manual Merge Queue:        ${counts.manualMergeQueue}`);
    console.log(`   Brand Metrics:             ${counts.brandMetrics}`);
    console.log(`   Brand Metrics History:     ${counts.brandMetricsHistory}`);
    console.log(`   Model Versions:            ${counts.modelVersions}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const totalRecords = Object.values(counts).reduce((sum, count) => sum + count, 0);

    console.log('');
    console.log(`📊 Total Records: ${totalRecords}`);

    if (totalRecords === 0) {
      console.log('');
      console.log('✅ Database is completely empty!');
    } else {
      console.log('');
      console.log('⚠️  Database still contains some records.');
      
      // Show which tables have data
      const tablesWithData = Object.entries(counts)
        .filter(([_, count]) => count > 0)
        .map(([table, count]) => `   - ${table}: ${count}`);
      
      if (tablesWithData.length > 0) {
        console.log('');
        console.log('Tables with data:');
        tablesWithData.forEach(table => console.log(table));
      }
    }

    // If there are brands, show them
    if (counts.brands > 0) {
      console.log('');
      console.log('🏢 Brands in database:');
      const brands = await prisma.brand.findMany({
        select: {
          id: true,
          name: true,
          status: true,
          plan: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      brands.forEach((brand, index) => {
        console.log(`   ${index + 1}. ${brand.name} (${brand.id})`);
        console.log(`      Status: ${brand.status}, Plan: ${brand.plan}, Created: ${brand.createdAt.toISOString()}`);
      });
    }

    // If there are users, show them
    if (counts.users > 0) {
      console.log('');
      console.log('👤 Users in database:');
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          role: true,
          brandId: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (${user.role})`);
        console.log(`      ID: ${user.id}, Brand ID: ${user.brandId || 'N/A'}`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  checkDatabase()
    .then(() => {
      console.log('');
      console.log('Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { checkDatabase };

