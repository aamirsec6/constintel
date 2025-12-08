// GENERATOR: OMNICHANNEL_PLATFORM
// ASSUMPTIONS: Prisma client, database connected, DATABASE_URL in env
// HOW TO RUN: npm run seed:omnichannel or tsx src/scripts/generateOmnichannelMockData.ts

import { getPrismaClient } from '../db/prismaClient';
import { createOrUpdateProductIntent } from '../services/intent/productIntentService';
import { detectStoreVisit } from '../services/store/storeVisitService';

const prisma = getPrismaClient();

const BRAND_ID = process.env.TEST_BRAND_ID || 'test-brand';

// Sample products
const products = [
  { id: 'PROD001', name: 'Wireless Headphones', category: 'Electronics', price: 99.99 },
  { id: 'PROD002', name: 'Running Shoes', category: 'Sports', price: 129.99 },
  { id: 'PROD003', name: 'Coffee Maker', category: 'Home', price: 79.99 },
  { id: 'PROD004', name: 'Smart Watch', category: 'Electronics', price: 249.99 },
  { id: 'PROD005', name: 'Yoga Mat', category: 'Sports', price: 29.99 },
  { id: 'PROD006', name: 'Bluetooth Speaker', category: 'Electronics', price: 59.99 },
  { id: 'PROD007', name: 'Laptop Stand', category: 'Electronics', price: 49.99 },
  { id: 'PROD008', name: 'Water Bottle', category: 'Sports', price: 19.99 },
  { id: 'PROD009', name: 'Desk Lamp', category: 'Home', price: 39.99 },
  { id: 'PROD010', name: 'Phone Case', category: 'Electronics', price: 24.99 },
];

const stores = [
  { id: 'STORE001', name: 'Downtown Flagship' },
  { id: 'STORE002', name: 'Mall Location' },
  { id: 'STORE003', name: 'Airport Store' },
  { id: 'STORE004', name: 'Outlet Center' },
];

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

async function createProducts() {
  console.log('Creating products...');
  
  for (const product of products) {
    await prisma.product.upsert({
      where: { productId: product.id },
      update: {
        name: product.name,
        category: product.category,
        price: product.price,
        metadata: { imageUrl: `https://example.com/images/${product.id}.jpg` },
      },
      create: {
        brandId: BRAND_ID,
        productId: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
        metadata: { imageUrl: `https://example.com/images/${product.id}.jpg` },
      },
    });

    // Get the created product to use its ID
    const createdProduct = await prisma.product.findUnique({
      where: { productId: product.id },
    });

    if (createdProduct) {
      // Create inventory for each product in each store
      for (const store of stores) {
        await prisma.inventory.upsert({
          where: {
            productId_storeId: {
              productId: createdProduct.id,
              storeId: store.id,
            },
          },
          update: { quantity: randomInt(10, 100) },
          create: {
            brandId: BRAND_ID,
            productId: createdProduct.id,
            storeId: store.id,
            storeName: store.name,
            quantity: randomInt(10, 100),
          },
        });
      }
    }
  }

  console.log(`✅ Created ${products.length} products with inventory`);
}

async function generateProductIntents(profileIds: string[]) {
  console.log('Generating product intents...');
  
  let totalIntents = 0;
  const sampleSize = Math.min(profileIds.length, 200); // Sample 200 profiles for intents
  const sampledProfiles = profileIds.slice(0, sampleSize);

  for (const profileId of sampledProfiles) {
    // Each profile has 1-3 product intents
    const intentCount = randomInt(1, 3);
    
    for (let i = 0; i < intentCount; i++) {
      const product = randomElement(products);
      const intentTypes = ['product_view', 'product_search', 'cart_add', 'wishlist_add'];
      const intentType = randomElement(intentTypes);
      
      const daysAgo = randomInt(0, 7);
      const lastSeenAt = new Date();
      lastSeenAt.setDate(lastSeenAt.getDate() - daysAgo);

      try {
        // Get product by productId to get its ID
        const productRecord = await prisma.product.findUnique({
          where: { productId: product.id },
        });

        if (productRecord) {
          await createOrUpdateProductIntent({
            brandId: BRAND_ID,
            profileId,
            productId: productRecord.id,
            productName: product.name,
            category: product.category,
            intentType,
            sourceChannel: randomElement(['shopify_web', 'woocommerce_web', 'mobile_app']),
            viewDuration: intentType === 'product_view' ? randomInt(30, 300) : undefined,
            searchQuery: intentType === 'product_search' ? product.name : undefined,
            context: {
              hoursSinceLastView: daysAgo * 24,
              viewedMultipleTimes: Math.random() > 0.7,
            },
          });
          totalIntents++;
        }
      } catch (error) {
        console.error(`Error creating product intent for ${profileId}:`, error);
      }
    }
  }

  console.log(`✅ Generated ${totalIntents} product intents`);
}

async function generateStoreVisits(profileIds: string[]) {
  console.log('Generating store visits...');
  
  let totalVisits = 0;
  const sampleSize = Math.min(profileIds.length, 100); // Sample 100 profiles for store visits
  const sampledProfiles = profileIds.slice(0, sampleSize);

  for (const profileId of sampledProfiles) {
    // 20% of sampled profiles visit stores
    if (Math.random() > 0.8) {
      const store = randomElement(stores);
      const detectionMethods = ['qr_scan', 'geofence', 'pos_lookup', 'checkin'];
      const detectionMethod = randomElement(detectionMethods);

      const daysAgo = randomInt(0, 14);
      const checkInAt = new Date();
      checkInAt.setDate(checkInAt.getDate() - daysAgo);

      try {
        await detectStoreVisit({
          brandId: BRAND_ID,
          profileId,
          storeId: store.id,
          storeName: store.name,
          detectionMethod,
          location: {
            lat: randomFloat(37.7, 37.8),
            lng: randomFloat(-122.5, -122.4),
            accuracy: randomFloat(10, 50),
          },
        });
        totalVisits++;
      } catch (error) {
        console.error(`Error creating store visit for ${profileId}:`, error);
      }
    }
  }

  console.log(`✅ Generated ${totalVisits} store visits`);
}

async function generateCampaigns() {
  console.log('Creating marketing campaigns...');
  
  const campaigns = [
    {
      name: 'Summer Sale 2024',
      description: 'Summer promotion for all customers',
      campaignType: 'one_time',
      targetSegment: { type: 'all' },
      targetChannels: ['whatsapp', 'email'],
      messageTemplate: {
        subject: 'Summer Sale - 20% Off Everything!',
        body: 'Hi {{customer_name}}, enjoy 20% off all products this summer!',
      },
      schedule: {
        start_date: '2024-06-01',
        end_date: '2024-08-31',
      },
      status: 'active',
    },
    {
      name: 'High-Value Customer VIP',
      description: 'Exclusive offers for high-value customers',
      campaignType: 'recurring',
      targetSegment: { type: 'ml_segment', name: 'high_value' },
      targetChannels: ['whatsapp'],
      messageTemplate: {
        subject: 'VIP Exclusive Offer',
        body: 'Hi {{customer_name}}, as a VIP customer, here\'s an exclusive offer just for you!',
      },
      schedule: {
        start_date: '2024-01-01',
        frequency: 'monthly',
      },
      status: 'active',
    },
    {
      name: 'Churn Prevention',
      description: 'Retention campaign for at-risk customers',
      campaignType: 'triggered',
      targetSegment: { type: 'ml_segment', name: 'at_risk' },
      targetChannels: ['email', 'whatsapp'],
      messageTemplate: {
        subject: 'We Miss You!',
        body: 'Hi {{customer_name}}, we noticed you haven\'t shopped with us recently. Here\'s a special offer!',
      },
      status: 'active',
    },
  ];

  for (const campaign of campaigns) {
    await prisma.campaign.create({
      data: {
        brandId: BRAND_ID,
        ...campaign,
      },
    });
  }

  console.log(`✅ Created ${campaigns.length} marketing campaigns`);
}

async function generateAutomations() {
  console.log('Creating marketing automations...');
  
  const automations = [
    {
      name: 'Churn Risk Alert',
      trigger: { type: 'ml_prediction', metric: 'churn_risk', operator: '>', threshold: 0.7 },
      conditions: { segment: 'at_risk', channel: 'whatsapp' },
      actions: [
        {
          type: 'send_whatsapp_message',
          template: 'Hi {{customer_name}}! We noticed you haven\'t shopped with us recently. Here\'s a special 20% off coupon just for you!',
        },
      ],
      enabled: true,
    },
    {
      name: 'Cart Abandonment',
      trigger: { type: 'event', eventType: 'cart_abandoned' },
      conditions: { channel: 'whatsapp' },
      actions: [
        {
          type: 'send_whatsapp_message',
          template: 'Hi {{customer_name}}! You left items in your cart. Complete your purchase now and get 10% off!',
        },
      ],
      enabled: true,
    },
    {
      name: 'Product Intent - High Intent',
      trigger: { type: 'product_intent', minScore: 70 },
      conditions: { channel: 'whatsapp' },
      actions: [
        {
          type: 'send_whatsapp_message',
          template: 'Hi {{customer_name}}! We noticed you\'re interested in {{product_name}}. Visit our store to see it in person!',
        },
      ],
      enabled: true,
    },
  ];

  for (const automation of automations) {
    await prisma.marketingAutomation.create({
      data: {
        brandId: BRAND_ID,
        ...automation,
      },
    });
  }

  console.log(`✅ Created ${automations.length} marketing automations`);
}

async function generateCustomerJourneys(profileIds: string[]) {
  console.log('Generating customer journeys...');
  
  let totalJourneys = 0;
  const sampleSize = Math.min(profileIds.length, 300);
  const sampledProfiles = profileIds.slice(0, sampleSize);

  const stages = ['awareness', 'consideration', 'purchase', 'retention'];
  const nextBestActions = [
    'Send product recommendation',
    'Offer discount coupon',
    'Invite to store',
    'Request feedback',
    'Upsell related products',
  ];

  for (const profileId of sampledProfiles) {
    const profile = await prisma.customerProfile.findUnique({
      where: { id: profileId },
      select: { totalOrders: true, lifetimeValue: true },
    });

    if (!profile) continue;

    let currentStage = 'awareness';
    if (profile.totalOrders > 5) {
      currentStage = 'retention';
    } else if (profile.totalOrders > 0) {
      currentStage = 'purchase';
    } else if (profile.totalOrders === 0) {
      currentStage = Math.random() > 0.5 ? 'consideration' : 'awareness';
    }

    const journeyScore = Math.min(100, (profile.totalOrders * 20) + (profile.lifetimeValue.toNumber() / 10));

    await prisma.customerJourney.upsert({
      where: { profileId },
      update: {
        currentStage,
        journeyScore,
        nextBestAction: randomElement(nextBestActions),
        touchpoints: [
          { type: 'page_view', timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          { type: 'product_view', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
        ],
      },
      create: {
        profileId,
        brandId: BRAND_ID,
        currentStage,
        journeyScore,
        nextBestAction: randomElement(nextBestActions),
        touchpoints: [
          { type: 'page_view', timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          { type: 'product_view', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
        ],
      },
    });

    totalJourneys++;
  }

  console.log(`✅ Generated ${totalJourneys} customer journeys`);
}

async function generatePredictions(profileIds: string[]) {
  console.log('Generating ML predictions...');
  
  let totalPredictions = 0;
  const sampleSize = Math.min(profileIds.length, 500);
  const sampledProfiles = profileIds.slice(0, sampleSize);

  for (const profileId of sampledProfiles) {
    const profile = await prisma.customerProfile.findUnique({
      where: { id: profileId },
      select: { totalOrders: true, lifetimeValue: true },
    });

    if (!profile) continue;

    // Calculate mock predictions based on profile data
    const ltv = profile.lifetimeValue.toNumber();
    const orders = profile.totalOrders;
    
    // Churn score: higher for customers with low recent activity
    const churnScore = orders === 0 ? randomFloat(0.6, 0.9) : randomFloat(0.1, 0.4);
    
    // LTV score: based on current LTV with some prediction
    const ltvScore = ltv + randomFloat(-100, 500);
    
    // Segment: based on LTV and orders
    let segment = 'low_value';
    if (ltv > 500 && orders > 3) {
      segment = 'high_value';
    } else if (ltv > 200 || orders > 1) {
      segment = 'medium_value';
    } else if (churnScore > 0.7) {
      segment = 'at_risk';
    }

    // Recommendations
    const recommendations = products
      .slice(0, 3)
      .map(p => ({
        product_id: p.id,
        product_name: p.name,
        category: p.category,
        score: randomFloat(0.6, 0.95),
      }));

    await prisma.prediction.upsert({
      where: { profileId },
      update: {
        churnScore,
        ltvScore,
        segment,
        recommendations: recommendations as any,
        modelVersion: 'v1.0.0-mock',
      },
      create: {
        profileId,
        churnScore,
        ltvScore,
        segment,
        recommendations: recommendations as any,
        modelVersion: 'v1.0.0-mock',
      },
    });

    totalPredictions++;
  }

  console.log(`✅ Generated ${totalPredictions} ML predictions`);
}

async function main() {
  console.log('🎲 Generating Omnichannel Mock Data...');
  console.log(`Brand ID: ${BRAND_ID}`);
  console.log('');

  const startTime = Date.now();

  try {
    // Get existing profiles
    const profiles = await prisma.customerProfile.findMany({
      where: { brandId: BRAND_ID },
      select: { id: true },
      take: 1000, // Use up to 1000 profiles
    });

    if (profiles.length === 0) {
      console.log('⚠️  No customer profiles found. Please run the base seed script first:');
      console.log('   npm run seed:small');
      process.exit(1);
    }

    const profileIds = profiles.map(p => p.id);
    console.log(`Found ${profileIds.length} existing profiles to work with\n`);

    // Create products and inventory
    await createProducts();
    console.log('');

    // Generate product intents
    await generateProductIntents(profileIds);
    console.log('');

    // Generate store visits
    await generateStoreVisits(profileIds);
    console.log('');

    // Create campaigns
    await generateCampaigns();
    console.log('');

    // Create automations
    await generateAutomations();
    console.log('');

    // Generate customer journeys
    await generateCustomerJourneys(profileIds);
    console.log('');

    // Generate predictions
    await generatePredictions(profileIds);
    console.log('');

    // Summary
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    const stats = {
      products: await prisma.product.count({ where: { brandId: BRAND_ID } }),
      productIntents: await prisma.productIntent.count({ where: { brandId: BRAND_ID } }),
      storeVisits: await prisma.storeVisit.count({ where: { brandId: BRAND_ID } }),
      campaigns: await prisma.campaign.count({ where: { brandId: BRAND_ID } }),
      automations: await prisma.marketingAutomation.count({ where: { brandId: BRAND_ID } }),
      journeys: await prisma.customerJourney.count({ where: { brandId: BRAND_ID } }),
      predictions: await prisma.prediction.count(),
    };

    console.log('📊 Summary:');
    console.log(`  Products: ${stats.products}`);
    console.log(`  Product Intents: ${stats.productIntents}`);
    console.log(`  Store Visits: ${stats.storeVisits}`);
    console.log(`  Campaigns: ${stats.campaigns}`);
    console.log(`  Automations: ${stats.automations}`);
    console.log(`  Customer Journeys: ${stats.journeys}`);
    console.log(`  Predictions: ${stats.predictions}`);
    console.log(`  Duration: ${duration} seconds`);
    console.log('');
    console.log('✅ Omnichannel mock data generation complete!');
    console.log('');
    console.log('🎉 Your platform is now populated with:');
    console.log('   • Products with inventory');
    console.log('   • Product intents from customers');
    console.log('   • Store visits');
    console.log('   • Marketing campaigns');
    console.log('   • Marketing automations');
    console.log('   • Customer journey stages');
    console.log('   • ML predictions (churn, LTV, segments)');
  } catch (error) {
    console.error('❌ Error generating mock data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

