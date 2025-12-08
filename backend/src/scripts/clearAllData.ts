// GENERATOR: FULL_PLATFORM
// ASSUMPTIONS: Prisma client, database connected
// HOW TO RUN: tsx src/scripts/clearAllData.ts
// WARNING: This will delete ALL data including brands, users, and all related records

import { getPrismaClient } from '../db/prismaClient';

const prisma = getPrismaClient();

async function clearAllData() {
  console.log('🧹 Clearing ALL Data from ConstIntel...');
  console.log('⚠️  WARNING: This will delete ALL brands, users, and all related data!');
  console.log('');

  try {
    // Delete in order (respecting foreign key constraints)
    // Start with the most dependent records first
    
    console.log('1. Deleting campaign executions...');
    const campaignExecutions = await prisma.campaignExecution.deleteMany({});
    console.log(`   ✓ Deleted ${campaignExecutions.count} campaign executions`);

    console.log('2. Deleting automation executions...');
    const automationExecutions = await prisma.automationExecution.deleteMany({});
    console.log(`   ✓ Deleted ${automationExecutions.count} automation executions`);

    console.log('3. Deleting in-store alerts...');
    const inStoreAlerts = await prisma.inStoreAlert.deleteMany({});
    console.log(`   ✓ Deleted ${inStoreAlerts.count} in-store alerts`);

    console.log('4. Deleting store visits...');
    const storeVisits = await prisma.storeVisit.deleteMany({});
    console.log(`   ✓ Deleted ${storeVisits.count} store visits`);

    console.log('5. Deleting product intents...');
    const productIntents = await prisma.productIntent.deleteMany({});
    console.log(`   ✓ Deleted ${productIntents.count} product intents`);

    console.log('6. Deleting customer journeys...');
    const customerJourneys = await prisma.customerJourney.deleteMany({});
    console.log(`   ✓ Deleted ${customerJourneys.count} customer journeys`);

    console.log('7. Deleting attributions...');
    const attributions = await prisma.attribution.deleteMany({});
    console.log(`   ✓ Deleted ${attributions.count} attributions`);

    console.log('8. Deleting campaigns...');
    const campaigns = await prisma.campaign.deleteMany({});
    console.log(`   ✓ Deleted ${campaigns.count} campaigns`);

    console.log('9. Deleting marketing automations...');
    const marketingAutomations = await prisma.marketingAutomation.deleteMany({});
    console.log(`   ✓ Deleted ${marketingAutomations.count} marketing automations`);

    console.log('10. Deleting inventory...');
    const inventory = await prisma.inventory.deleteMany({});
    console.log(`   ✓ Deleted ${inventory.count} inventory records`);

    console.log('11. Deleting products...');
    const products = await prisma.product.deleteMany({});
    console.log(`   ✓ Deleted ${products.count} products`);

    console.log('12. Deleting predictions...');
    const predictions = await prisma.prediction.deleteMany({});
    console.log(`   ✓ Deleted ${predictions.count} predictions`);

    console.log('13. Deleting features...');
    const features = await prisma.feature.deleteMany({});
    console.log(`   ✓ Deleted ${features.count} features`);

    console.log('14. Deleting merge history...');
    const mergeHistory = await prisma.mergeHistory.deleteMany({});
    console.log(`   ✓ Deleted ${mergeHistory.count} merge history records`);

    console.log('15. Deleting manual merge queue...');
    const manualMergeQueue = await prisma.manualMergeQueue.deleteMany({});
    console.log(`   ✓ Deleted ${manualMergeQueue.count} manual merge queue records`);

    console.log('16. Deleting customer raw events...');
    const rawEvents = await prisma.customerRawEvent.deleteMany({});
    console.log(`   ✓ Deleted ${rawEvents.count} customer raw events`);

    console.log('17. Deleting customer profiles...');
    const customerProfiles = await prisma.customerProfile.deleteMany({});
    console.log(`   ✓ Deleted ${customerProfiles.count} customer profiles`);

    console.log('18. Deleting brand metrics history...');
    const brandMetricsHistory = await prisma.brandMetricsHistory.deleteMany({});
    console.log(`   ✓ Deleted ${brandMetricsHistory.count} brand metrics history records`);

    console.log('19. Deleting brand metrics...');
    const brandMetrics = await prisma.brandMetrics.deleteMany({});
    console.log(`   ✓ Deleted ${brandMetrics.count} brand metrics`);

    console.log('20. Deleting model versions...');
    const modelVersions = await prisma.modelVersion.deleteMany({});
    console.log(`   ✓ Deleted ${modelVersions.count} model versions`);

    console.log('21. Deleting users...');
    const users = await prisma.user.deleteMany({});
    console.log(`   ✓ Deleted ${users.count} users`);

    console.log('22. Deleting brands...');
    const brands = await prisma.brand.deleteMany({});
    console.log(`   ✓ Deleted ${brands.count} brands`);

    console.log('');
    console.log('✅ All data cleared successfully!');
    console.log('');
    console.log('Summary:');
    console.log(`   - ${brands.count} brands deleted`);
    console.log(`   - ${users.count} users deleted`);
    console.log(`   - ${customerProfiles.count} customer profiles deleted`);
    console.log(`   - ${products.count} products deleted`);
    console.log(`   - ${campaigns.count} campaigns deleted`);
    console.log(`   - ${marketingAutomations.count} marketing automations deleted`);
    console.log('');
    console.log('Your database is now completely empty and ready for fresh data!');
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  clearAllData()
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { clearAllData };

