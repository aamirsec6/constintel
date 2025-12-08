// GENERATOR: REAL_WORLD_SCENARIOS
// ASSUMPTIONS: Prisma client, database connected, DATABASE_URL in env
// HOW TO RUN: tsx src/scripts/generateRealWorldScenario.ts --scenario <scenario-name>
// Scenarios: omnichannel, high-value, churn-risk, manual-merge

import { getPrismaClient } from '../db/prismaClient';
import { ingestEvent } from '../services/ingestion/eventIngestion';

const prisma = getPrismaClient();

const BRAND_ID = process.env.TEST_BRAND_ID || 'test-brand';

// Parse command line arguments
const args = process.argv.slice(2);
const scenarioArg = args.find(arg => arg.startsWith('--scenario='));
const scenario = scenarioArg ? scenarioArg.split('=')[1] : args[1] || 'omnichannel';

async function generateOmnichannelScenario() {
  console.log('🎭 Generating Scenario 1: Omnichannel Customer Journey');
  console.log('Customer: Sarah Johnson\n');

  const email = 'sarah.johnson@email.com';
  const phone = '+1-555-0123';
  const loyaltyId = 'LOY-789456';

  // Day 1, 10:00 AM - Shopify Purchase
  console.log('📦 Day 1, 10:00 AM - Shopify Purchase');
  const purchase1 = await ingestEvent({
    brandId: BRAND_ID,
    eventType: 'purchase',
    payload: {
      id: 12345,
      email: email,
      total_spent: '89.99',
      currency: 'USD',
      items: [
        {
          product_id: 'PROD-001',
          product_name: 'Summer Collection T-Shirt',
          category: 'Apparel',
          price: '89.99',
          quantity: 1,
        },
      ],
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      order_number: 'ORD-12345',
    },
  });
  console.log(`   ✅ Event ingested: ${purchase1.eventId}`);
  console.log(`   Profile: ${purchase1.profileId} (created: ${purchase1.profileCreated})`);

  // Day 1, 2:30 PM - WhatsApp Message
  console.log('\n💬 Day 1, 2:30 PM - WhatsApp Message');
  const whatsapp = await ingestEvent({
    brandId: BRAND_ID,
    eventType: 'whatsapp_message',
    payload: {
      MessageSid: 'SM123456789',
      From: `whatsapp:${phone}`,
      To: 'whatsapp:+15559999',
      Body: 'When will my order ship?',
      MessageStatus: 'received',
      AccountSid: 'ACxxxxx',
    },
  });
  console.log(`   ✅ Event ingested: ${whatsapp.eventId}`);
  console.log(`   Profile: ${whatsapp.profileId} (created: ${whatsapp.profileCreated})`);
  if (whatsapp.profilesMerged) {
    console.log(`   🔗 Profiles merged!`);
  }

  // Day 3, 11:00 AM - POS Store Visit
  console.log('\n🏪 Day 3, 11:00 AM - POS Store Visit & Purchase');
  const storeVisit = await ingestEvent({
    brandId: BRAND_ID,
    eventType: 'store_visit',
    payload: {
      store_id: 'STORE-001',
      store_name: 'Downtown Location',
      loyalty_id: loyaltyId,
      phone: phone,
      transaction_id: 'TXN-98765',
      total: 125.50,
      items: [
        {
          product_id: 'PROD-002',
          product_name: 'Premium Sneakers',
          category: 'Footwear',
          price: '125.50',
          quantity: 1,
        },
      ],
      check_in_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      check_out_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString(),
      detection_method: 'qr_scan',
    },
  });
  console.log(`   ✅ Event ingested: ${storeVisit.eventId}`);

  // Also create purchase event for POS
  const posPurchase = await ingestEvent({
    brandId: BRAND_ID,
    eventType: 'purchase',
    payload: {
      store_id: 'STORE-001',
      loyalty_id: loyaltyId,
      phone: phone,
      total: 125.50,
      items: [
        {
          product_id: 'PROD-002',
          product_name: 'Premium Sneakers',
          category: 'Footwear',
          price: '125.50',
        },
      ],
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
  });
  console.log(`   ✅ Purchase event ingested: ${posPurchase.eventId}`);

  // Day 5, 3:00 PM - Cart Abandonment
  console.log('\n🛒 Day 5, 3:00 PM - Cart Abandonment');
  const cartAdd = await ingestEvent({
    brandId: BRAND_ID,
    eventType: 'cart_add',
    payload: {
      product_id: 'PROD-003',
      product_name: 'Premium Sneakers',
      category: 'Footwear',
      price: '125.50',
      session_id: 'sess-abc123',
      page_url: 'https://store.com/products/premium-sneakers',
      email: email, // Include email to match profile
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    },
  });
  console.log(`   ✅ Event ingested: ${cartAdd.eventId}`);
  console.log(`   ⚠️  Note: Cart abandonment automation should trigger after 2 hours`);

  console.log('\n✅ Scenario 1 complete!');
  console.log(`\n📊 Summary:`);
  console.log(`   - Events created: 5`);
  console.log(`   - Profile ID: ${purchase1.profileId}`);
  console.log(`   - Check profile: http://localhost:3000/api/profiles/${purchase1.profileId}/360`);
}

async function generateHighValueScenario() {
  console.log('🎭 Generating Scenario 2: High-Value Customer Identification');
  console.log('Customer: Michael Chen\n');

  const email = 'michael.chen@email.com';
  const phone = '+1-555-0456';

  const purchases = [
    { day: 7, amount: 199.99, product: 'Designer Jacket', category: 'Apparel' },
    { day: 5, amount: 89.99, product: 'Summer T-Shirt', category: 'Apparel' },
    { day: 4, amount: 75.00, product: 'Casual Pants', category: 'Apparel' },
    { day: 2, amount: 50.00, product: 'Accessories Set', category: 'Apparel' },
    { day: 1, amount: 35.00, product: 'Socks Pack', category: 'Apparel' },
  ];

  let profileId: string | null = null;

  for (let i = 0; i < purchases.length; i++) {
    const purchase = purchases[i];
    const daysAgo = purchase.day;
    console.log(`📦 Purchase ${i + 1} (${daysAgo} days ago) - $${purchase.amount}`);
    
    const result = await ingestEvent({
      brandId: BRAND_ID,
      eventType: 'purchase',
      payload: {
        id: 20000 + i,
        email: email,
        phone: phone,
        total_spent: purchase.amount.toString(),
        currency: 'USD',
        items: [
          {
            product_id: `PROD-${200 + i}`,
            product_name: purchase.product,
            category: purchase.category,
            price: purchase.amount.toString(),
            quantity: 1,
          },
        ],
        created_at: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
        order_number: `ORD-${20000 + i}`,
      },
    });

    if (!profileId) {
      profileId = result.profileId;
    }
    console.log(`   ✅ Event ingested: ${result.eventId}`);
  }

  console.log('\n✅ Scenario 2 complete!');
  console.log(`\n📊 Summary:`);
  console.log(`   - Events created: ${purchases.length}`);
  console.log(`   - Profile ID: ${profileId}`);
  console.log(`   - Total LTV: $${purchases.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}`);
  console.log(`   - Check profile: http://localhost:3000/api/profiles/${profileId}/360`);
  console.log(`   - Expected segment: "champion" (after ML prediction)`);
}

async function generateChurnRiskScenario() {
  console.log('🎭 Generating Scenario 3: Churn Risk Detection & Retention');
  console.log('Customer: Emma Williams\n');

  const email = 'emma.williams@email.com';
  const phone = '+1-555-0789';

  // Historical purchases (older)
  const historicalPurchases = [
    { daysAgo: 90, amount: 150.00, product: 'Winter Coat', category: 'Apparel' },
    { daysAgo: 60, amount: 75.00, product: 'Scarf Set', category: 'Apparel' },
    { daysAgo: 45, amount: 100.00, product: 'Boots', category: 'Footwear' },
  ];

  let profileId: string | null = null;

  console.log('📦 Creating historical purchases...');
  for (const purchase of historicalPurchases) {
    const result = await ingestEvent({
      brandId: BRAND_ID,
      eventType: 'purchase',
      payload: {
        id: 30000 + historicalPurchases.indexOf(purchase),
        email: email,
        phone: phone,
        total_spent: purchase.amount.toString(),
        currency: 'USD',
        items: [
          {
            product_id: `PROD-${300 + historicalPurchases.indexOf(purchase)}`,
            product_name: purchase.product,
            category: purchase.category,
            price: purchase.amount.toString(),
            quantity: 1,
          },
        ],
        created_at: new Date(Date.now() - purchase.daysAgo * 24 * 60 * 60 * 1000).toISOString(),
        order_number: `ORD-${30000 + historicalPurchases.indexOf(purchase)}`,
      },
    });

    if (!profileId) {
      profileId = result.profileId;
    }
    console.log(`   ✅ Purchase ${purchase.daysAgo} days ago - $${purchase.amount}`);
  }

  console.log('\n⏰ Current state:');
  console.log(`   - Last purchase: 45 days ago`);
  console.log(`   - Expected churn risk: HIGH (75%+)`);
  console.log(`   - Expected segment: "at_risk"`);

  console.log('\n💬 Simulating retention campaign trigger...');
  console.log('   ⚠️  Note: Automation should trigger based on churn score');

  // Simulate re-engagement (optional - can be added later)
  console.log('\n📦 Simulating re-engagement purchase (Day 47)...');
  const reengagement = await ingestEvent({
    brandId: BRAND_ID,
    eventType: 'purchase',
    payload: {
      id: 30003,
      email: email,
      phone: phone,
      total_spent: '120.00',
      currency: 'USD',
      items: [
        {
          product_id: 'PROD-303',
          product_name: 'New Collection Dress',
          category: 'Apparel',
          price: '120.00',
          quantity: 1,
        },
      ],
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      order_number: 'ORD-30003',
    },
  });
  console.log(`   ✅ Re-engagement purchase: ${reengagement.eventId}`);
  console.log(`   - Expected churn risk: DECREASED (25% or lower)`);
  console.log(`   - Expected segment: "loyal"`);

  console.log('\n✅ Scenario 3 complete!');
  console.log(`\n📊 Summary:`);
  console.log(`   - Events created: ${historicalPurchases.length + 1}`);
  console.log(`   - Profile ID: ${profileId}`);
  console.log(`   - Total LTV: $${(historicalPurchases.reduce((sum, p) => sum + p.amount, 0) + 120).toFixed(2)}`);
  console.log(`   - Check profile: http://localhost:3000/api/profiles/${profileId}/360`);
}

async function generateManualMergeScenario() {
  console.log('🎭 Generating Scenario 4: Profile Merge with Manual Review');
  console.log('Customer: Multiple identifiers across channels\n');

  const email = 'customer@example.com';
  const phone = '+1-555-1111';
  const loyaltyId = 'LOY-1111';
  const cookieId = 'cookie-abc123';
  const deviceId = 'device-xyz789';

  const profiles: string[] = [];

  // Profile 1: Shopify (Email)
  console.log('📦 Profile 1: Shopify Purchase (Email)');
  const p1 = await ingestEvent({
    brandId: BRAND_ID,
    eventType: 'purchase',
    payload: {
      id: 40001,
      email: email,
      total_spent: '200.00',
      items: [{ product_name: 'Product A', price: '200.00' }],
    },
  });
  profiles.push(p1.profileId!);
  console.log(`   ✅ Profile created: ${p1.profileId}`);

  // Profile 2: WhatsApp (Phone)
  console.log('\n💬 Profile 2: WhatsApp Message (Phone)');
  const p2 = await ingestEvent({
    brandId: BRAND_ID,
    eventType: 'whatsapp_message',
    payload: {
      From: `whatsapp:${phone}`,
      Body: 'Hello',
      MessageStatus: 'received',
    },
  });
  profiles.push(p2.profileId!);
  console.log(`   ✅ Profile created: ${p2.profileId}`);

  // Profile 3: POS (Loyalty ID + Phone)
  console.log('\n🏪 Profile 3: POS Purchase (Loyalty ID + Phone)');
  const p3 = await ingestEvent({
    brandId: BRAND_ID,
    eventType: 'purchase',
    payload: {
      store_id: 'STORE-001',
      loyalty_id: loyaltyId,
      phone: phone,
      total: 150.00,
      items: [{ product_name: 'Product B', price: '150.00' }],
    },
  });
  profiles.push(p3.profileId!);
  console.log(`   ✅ Profile created: ${p3.profileId}`);

  // Profile 4: Website (Cookie + Email)
  console.log('\n🌐 Profile 4: Website View (Cookie + Email)');
  const p4 = await ingestEvent({
    brandId: BRAND_ID,
    eventType: 'page_view',
    payload: {
      cookie_id: cookieId,
      email: email,
      page_url: 'https://store.com/products',
    },
  });
  profiles.push(p4.profileId!);
  console.log(`   ✅ Profile created: ${p4.profileId}`);

  // Profile 5: Mobile App (Device ID + Email)
  console.log('\n📱 Profile 5: Mobile App Event (Device ID + Email)');
  const p5 = await ingestEvent({
    brandId: BRAND_ID,
    eventType: 'app_open',
    payload: {
      device_id: deviceId,
      email: email,
      app_version: '1.0.0',
    },
  });
  profiles.push(p5.profileId!);
  console.log(`   ✅ Profile created: ${p5.profileId}`);

  // Now trigger merge detection with event containing all identifiers
  console.log('\n🔗 Triggering merge detection with event containing all identifiers...');
  const mergeTrigger = await ingestEvent({
    brandId: BRAND_ID,
    eventType: 'purchase',
    payload: {
      id: 40006,
      email: email,
      phone: phone,
      loyalty_id: loyaltyId,
      cookie_id: cookieId,
      device_id: deviceId,
      total_spent: '100.00',
      items: [{ product_name: 'Product C', price: '100.00' }],
    },
  });

  console.log(`   ✅ Event ingested: ${mergeTrigger.eventId}`);
  console.log(`   Profile: ${mergeTrigger.profileId}`);

  if (mergeTrigger.profilesMerged) {
    console.log(`   🔗 Auto-merge occurred!`);
  } else {
    console.log(`   ⚠️  Note: If 5 profiles exceed merge limit, check manual_merge_queue table`);
  }

  console.log('\n✅ Scenario 4 complete!');
  console.log(`\n📊 Summary:`);
  console.log(`   - Profiles created: 5`);
  console.log(`   - Profile IDs: ${profiles.join(', ')}`);
  console.log(`   - Check manual merge queue: SELECT * FROM manual_merge_queue WHERE status = 'pending'`);
  console.log(`   - Check merge history: SELECT * FROM merge_history`);
}

async function main() {
  console.log('🚀 Real-World Scenario Data Generator\n');
  console.log(`Brand ID: ${BRAND_ID}`);
  console.log(`Scenario: ${scenario}\n`);

  try {
    switch (scenario) {
      case 'omnichannel':
        await generateOmnichannelScenario();
        break;
      case 'high-value':
        await generateHighValueScenario();
        break;
      case 'churn-risk':
        await generateChurnRiskScenario();
        break;
      case 'manual-merge':
        await generateManualMergeScenario();
        break;
      default:
        console.log(`❌ Unknown scenario: ${scenario}`);
        console.log('Available scenarios: omnichannel, high-value, churn-risk, manual-merge');
        process.exit(1);
    }

    console.log('\n✅ All done!');
  } catch (error) {
    console.error('❌ Error generating scenario:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

