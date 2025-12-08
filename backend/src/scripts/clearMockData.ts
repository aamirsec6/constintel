// GENERATOR: OMNICHANNEL_PLATFORM
// ASSUMPTIONS: Prisma client, database connected
// HOW TO RUN: tsx src/scripts/clearMockData.ts

import { getPrismaClient } from '../db/prismaClient';

const prisma = getPrismaClient();

const BRAND_ID = process.env.TEST_BRAND_ID || 'test-brand';

async function clearMockData() {
  console.log('🧹 Clearing Mock Data from ConstIntel...');
  console.log(`Brand ID: ${BRAND_ID}`);
  console.log('');

  try {
    // Delete in order (respecting foreign key constraints)
    
    console.log('Deleting campaign executions...');
    await prisma.campaignExecution.deleteMany({
      where: { campaign: { brandId: BRAND_ID } },
    });

    console.log('Deleting in-store alerts...');
    await prisma.inStoreAlert.deleteMany({
      where: { brandId: BRAND_ID },
    });

    console.log('Deleting store visits...');
    await prisma.storeVisit.deleteMany({
      where: { brandId: BRAND_ID },
    });

    console.log('Deleting product intents...');
    await prisma.productIntent.deleteMany({
      where: { brandId: BRAND_ID },
    });

    console.log('Deleting customer journeys...');
    await prisma.customerJourney.deleteMany({
      where: { brandId: BRAND_ID },
    });

    console.log('Deleting attributions...');
    await prisma.attribution.deleteMany({
      where: { brandId: BRAND_ID },
    });

    console.log('Deleting campaigns...');
    await prisma.campaign.deleteMany({
      where: { brandId: BRAND_ID },
    });

    console.log('Deleting marketing automations...');
    await prisma.marketingAutomation.deleteMany({
      where: { brandId: BRAND_ID },
    });

    console.log('Deleting automation executions...');
    await prisma.automationExecution.deleteMany({
      where: { automation: { brandId: BRAND_ID } },
    });

    console.log('Deleting inventory...');
    await prisma.inventory.deleteMany({
      where: { brandId: BRAND_ID },
    });

    console.log('Deleting products...');
    await prisma.product.deleteMany({
      where: { brandId: BRAND_ID },
    });

    console.log('Deleting predictions...');
    await prisma.prediction.deleteMany({
      where: { profile: { brandId: BRAND_ID } },
    });

    console.log('Deleting features...');
    await prisma.feature.deleteMany({
      where: { profile: { brandId: BRAND_ID } },
    });

    console.log('Deleting raw events...');
    await prisma.customerRawEvent.deleteMany({
      where: { brandId: BRAND_ID },
    });

    console.log('Deleting merge history...');
    await prisma.mergeHistory.deleteMany({
      where: {
        OR: [
          { baseProfile: { brandId: BRAND_ID } },
          { mergedProfile: { brandId: BRAND_ID } },
        ],
      },
    });

    console.log('Deleting manual merge queue...');
    // ManualMergeQueue doesn't have brandId, delete all or filter by profileIds
    await prisma.manualMergeQueue.deleteMany({});

    console.log('Deleting customer profiles...');
    const deletedProfiles = await prisma.customerProfile.deleteMany({
      where: { brandId: BRAND_ID },
    });

    console.log('');
    console.log('✅ Mock data cleared successfully!');
    console.log(`   Deleted ${deletedProfiles.count} customer profiles`);
    console.log('');
    console.log('Your database is now clean and ready for real Shopify data!');
  } catch (error) {
    console.error('❌ Error clearing mock data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  clearMockData()
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

