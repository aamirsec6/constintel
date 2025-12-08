// GENERATOR: REAL_WORLD_MOCK_DATA
// ASSUMPTIONS: Prisma client, database connected, DATABASE_URL in env
// HOW TO RUN: npm run seed:realworld or tsx src/scripts/generateRealWorldMockData.ts [customerCount]

import { getPrismaClient } from '../db/prismaClient';
import { ingestEvent } from '../services/ingestion/eventIngestion';
import { trackProductIntent } from '../services/intent/productIntentService';
import { detectStoreVisit } from '../services/store/storeVisitService';
import { markIntentAsConverted } from '../services/intent/productIntentService';

const prisma = getPrismaClient();

const BRAND_ID = process.env.TEST_BRAND_ID || 'test-brand';

// Realistic product catalog for planogram testing
const products = [
  // Electronics - High intent, varying sales
  { id: 'PROD001', name: 'Wireless Headphones', category: 'Electronics', price: 99.99 },
  { id: 'PROD002', name: 'Smart Watch', category: 'Electronics', price: 249.99 },
  { id: 'PROD003', name: 'Bluetooth Speaker', category: 'Electronics', price: 59.99 },
  { id: 'PROD004', name: 'Phone Case', category: 'Electronics', price: 24.99 },
  { id: 'PROD005', name: 'Laptop Stand', category: 'Electronics', price: 49.99 },
  
  // Sports - Rising interest category
  { id: 'PROD006', name: 'Running Shoes', category: 'Sports', price: 129.99 },
  { id: 'PROD007', name: 'Yoga Mat', category: 'Sports', price: 29.99 },
  { id: 'PROD008', name: 'Water Bottle', category: 'Sports', price: 19.99 },
  { id: 'PROD009', name: 'Dumbbells Set', category: 'Sports', price: 79.99 },
  
  // Home - Underperforming category (high intent, low sales)
  { id: 'PROD010', name: 'Coffee Maker', category: 'Home', price: 79.99 },
  { id: 'PROD011', name: 'Desk Lamp', category: 'Home', price: 39.99 },
  { id: 'PROD012', name: 'Throw Pillows', category: 'Home', price: 24.99 },
  { id: 'PROD013', name: 'Wall Clock', category: 'Home', price: 34.99 },
  
  // Clothing - Stable category
  { id: 'PROD014', name: 'T-Shirt', category: 'Clothing', price: 19.99 },
  { id: 'PROD015', name: 'Jeans', category: 'Clothing', price: 49.99 },
  { id: 'PROD016', name: 'Sneakers', category: 'Clothing', price: 89.99 },
];

const stores = [
  { id: 'STORE001', name: 'Downtown Flagship' },
  { id: 'STORE002', name: 'Mall Location' },
  { id: 'STORE003', name: 'Airport Store' },
];

const firstNames = [
  'John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Jessica',
  'William', 'Ashley', 'James', 'Amanda', 'Christopher', 'Melissa', 'Daniel', 'Deborah',
  'Matthew', 'Stephanie', 'Anthony', 'Rebecca', 'Mark', 'Sharon', 'Donald', 'Laura',
  'Steven', 'Michelle', 'Paul', 'Kimberly', 'Andrew', 'Angela', 'Joshua', 'Amy',
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas', 'Taylor',
  'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris', 'Sanchez',
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

function generatePhone(): string {
  return `1${randomInt(200, 999)}${randomInt(200, 999)}${randomInt(1000, 9999)}`;
}

function generateEmail(firstName: string, lastName: string): string {
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${randomElement(domains)}`;
}

function generateDeviceId(): string {
  return `DEV${randomInt(100000, 999999)}`;
}

function generateCookieId(): string {
  return `cookie_${randomInt(1000000, 9999999)}`;
}

function generateLoyaltyId(): string {
  return `LOY${randomInt(10000, 99999)}`;
}

interface CustomerScenario {
  profileId: string;
  identifiers: {
    phone?: string;
    email?: string;
    deviceId?: string;
    cookieId?: string;
    loyaltyId?: string;
  };
  mergeScenario?: {
    type: 'phone_then_email' | 'email_then_phone' | 'device_then_phone' | 'multiple';
    secondProfileId?: string;
  };
}

/**
 * Generate customer profiles with merge scenarios
 * Creates customers that appear with different identifiers to test merging
 */
async function generateCustomerProfilesWithMergeScenarios(count: number): Promise<CustomerScenario[]> {
  console.log(`Generating ${count} customer profiles with merge scenarios...`);
  
  const scenarios: CustomerScenario[] = [];
  const mergeCount = Math.floor(count * 0.3); // 30% will have merge scenarios
  
  // First, create base profiles
  for (let i = 0; i < count; i++) {
    const firstName = randomElement(firstNames);
    const lastName = randomElement(lastNames);
    const phone = generatePhone();
    const email = generateEmail(firstName, lastName);
    
    // Determine identifier mix based on scenario
    let identifiers: any = {};
    let mergeScenario: any = undefined;
    
    if (i < mergeCount) {
      // Create merge scenarios
      const mergeType = randomElement(['phone_then_email', 'email_then_phone', 'device_then_phone', 'multiple']);
      
      if (mergeType === 'phone_then_email') {
        // First profile with phone only
        identifiers = { phone };
        const result1 = await ingestEvent({
          brandId: BRAND_ID,
          eventType: 'customer_created',
          payload: {
            first_name: firstName,
            last_name: lastName,
            phone,
          },
        });
        
        // Second profile with email (same person)
        const result2 = await ingestEvent({
          brandId: BRAND_ID,
          eventType: 'customer_created',
          payload: {
            first_name: firstName,
            last_name: lastName,
            email,
          },
        });
        
        mergeScenario = {
          type: mergeType,
          secondProfileId: result2.profileId,
        };
        
        scenarios.push({
          profileId: result1.profileId,
          identifiers: { phone },
          mergeScenario,
        });
      } else if (mergeType === 'email_then_phone') {
        // First profile with email only
        identifiers = { email };
        const result1 = await ingestEvent({
          brandId: BRAND_ID,
          eventType: 'customer_created',
          payload: {
            first_name: firstName,
            last_name: lastName,
            email,
          },
        });
        
        // Second profile with phone (same person)
        const result2 = await ingestEvent({
          brandId: BRAND_ID,
          eventType: 'customer_created',
          payload: {
            first_name: firstName,
            last_name: lastName,
            phone,
          },
        });
        
        mergeScenario = {
          type: mergeType,
          secondProfileId: result2.profileId,
        };
        
        scenarios.push({
          profileId: result1.profileId,
          identifiers: { email },
          mergeScenario,
        });
      } else if (mergeType === 'device_then_phone') {
        // First profile with device_id only
        const deviceId = generateDeviceId();
        identifiers = { device_id: deviceId };
        const result1 = await ingestEvent({
          brandId: BRAND_ID,
          eventType: 'customer_created',
          payload: {
            first_name: firstName,
            last_name: lastName,
            device_id: deviceId,
          },
        });
        
        // Second profile with phone (same person)
        const result2 = await ingestEvent({
          brandId: BRAND_ID,
          eventType: 'customer_created',
          payload: {
            first_name: firstName,
            last_name: lastName,
            phone,
          },
        });
        
        mergeScenario = {
          type: mergeType,
          secondProfileId: result2.profileId,
        };
        
        scenarios.push({
          profileId: result1.profileId,
          identifiers: { deviceId },
          mergeScenario,
        });
      } else {
        // Multiple identifiers - will be merged automatically
        const deviceId = generateDeviceId();
        const cookieId = generateCookieId();
        identifiers = { phone, email, device_id: deviceId, cookie_id: cookieId };
        const result = await ingestEvent({
          brandId: BRAND_ID,
          eventType: 'customer_created',
          payload: {
            first_name: firstName,
            last_name: lastName,
            phone,
            email,
            device_id: deviceId,
            cookie_id: cookieId,
          },
        });
        
        scenarios.push({
          profileId: result.profileId,
          identifiers: { phone, email, deviceId, cookieId },
          mergeScenario: { type: 'multiple' },
        });
      }
    } else {
      // Regular profile with mix of identifiers
      const hasPhone = Math.random() > 0.2;
      const hasEmail = Math.random() > 0.2;
      const hasDevice = Math.random() > 0.4;
      const hasCookie = Math.random() > 0.5;
      const hasLoyalty = Math.random() > 0.6;
      
      if (hasPhone) identifiers.phone = phone;
      if (hasEmail) identifiers.email = email;
      if (hasDevice) identifiers.device_id = generateDeviceId();
      if (hasCookie) identifiers.cookie_id = generateCookieId();
      if (hasLoyalty) identifiers.loyalty_id = generateLoyaltyId();
      
      const result = await ingestEvent({
        brandId: BRAND_ID,
        eventType: 'customer_created',
        payload: {
          first_name: firstName,
          last_name: lastName,
          ...identifiers,
        },
      });
      
      scenarios.push({
        profileId: result.profileId,
        identifiers,
      });
    }
    
    if (i % 50 === 0 && i > 0) {
      console.log(`  Created ${i}/${count} profiles...`);
    }
  }
  
  console.log(`✅ Generated ${scenarios.length} customer profiles`);
  console.log(`   - ${mergeCount} profiles with merge scenarios`);
  return scenarios;
}

/**
 * Create products and inventory if they don't exist
 */
async function ensureProductsExist() {
  console.log('Ensuring products and inventory exist...');
  
  for (const product of products) {
    await prisma.product.upsert({
      where: { productId: product.id },
      update: {
        name: product.name,
        category: product.category,
        price: product.price,
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
    
    // Create inventory for each store
    const productRecord = await prisma.product.findUnique({
      where: { productId: product.id },
    });
    
    if (productRecord) {
      for (const store of stores) {
        await prisma.inventory.upsert({
          where: {
            productId_storeId: {
              productId: productRecord.id,
              storeId: store.id,
            },
          },
          update: {},
          create: {
            brandId: BRAND_ID,
            productId: productRecord.id,
            storeId: store.id,
            storeName: store.name,
            quantity: randomInt(10, 100),
          },
        });
      }
    }
  }
  
  console.log(`✅ Products and inventory ready`);
}

/**
 * Generate realistic product intent patterns
 */
async function generateProductIntentsWithRealisticPatterns(
  scenarios: CustomerScenario[]
): Promise<Map<string, string[]>> {
  console.log('Generating realistic product intent patterns...');
  
  const profileIntents = new Map<string, string[]>(); // profileId -> productIds
  let totalIntents = 0;
  
  // Focus on 70% of profiles for intents
  const intentProfiles = scenarios.slice(0, Math.floor(scenarios.length * 0.7));
  
  for (const scenario of intentProfiles) {
    const intentCount = randomInt(2, 5); // 2-5 intents per customer
    const customerProducts: string[] = [];
    
    for (let i = 0; i < intentCount; i++) {
      const product = randomElement(products);
      const productRecord = await prisma.product.findUnique({
        where: { productId: product.id },
      });
      
      if (!productRecord) continue;
      
      // Determine intent type based on progression
      let intentType: string;
      let viewDuration: number | undefined;
      let searchQuery: string | undefined;
      
      if (i === 0) {
        // First interaction - usually a view
        intentType = 'product_view';
        viewDuration = randomInt(30, 180);
      } else if (i === 1 && Math.random() > 0.5) {
        // Second interaction - might be a search
        intentType = 'product_search';
        searchQuery = product.name;
      } else if (i === intentCount - 1 && Math.random() > 0.6) {
        // Last interaction - might add to cart
        intentType = 'cart_add';
      } else {
        // Other interactions - views or wishlist
        intentType = Math.random() > 0.7 ? 'wishlist_add' : 'product_view';
        if (intentType === 'product_view') {
          viewDuration = randomInt(60, 300);
        }
      }
      
      // Time distribution: some recent (7 days), some older (30 days)
      const daysAgo = i === 0 ? randomInt(0, 7) : randomInt(0, 30);
      const lastSeenAt = new Date();
      lastSeenAt.setDate(lastSeenAt.getDate() - daysAgo);
      const firstSeenAt = new Date(lastSeenAt.getTime() - (randomInt(1, 5) * 24 * 60 * 60 * 1000));
      
      try {
        // Create intent with historical dates using Prisma directly for more control
        const existingIntent = await prisma.productIntent.findFirst({
          where: {
            brandId: BRAND_ID,
            profileId: scenario.profileId,
            productId: productRecord.id,
            status: 'active',
          },
        });
        
        if (existingIntent) {
          // Update existing intent with new date
          await prisma.productIntent.update({
            where: { id: existingIntent.id },
            data: {
              lastSeenAt,
              intentType: intentType === 'cart_add' ? 'cart_add' : existingIntent.intentType,
            },
          });
        } else {
          // Create new intent with historical dates
          await trackProductIntent({
            brandId: BRAND_ID,
            profileId: scenario.profileId,
            productId: productRecord.id,
            productName: product.name,
            category: product.category,
            intentType,
            sourceChannel: randomElement(['web', 'mobile_app']),
            viewDuration,
            searchQuery,
            pageUrl: `https://example.com/products/${product.id}`,
          });
          
          // Update the created intent with historical dates
          const createdIntent = await prisma.productIntent.findFirst({
            where: {
              brandId: BRAND_ID,
              profileId: scenario.profileId,
              productId: productRecord.id,
              status: 'active',
            },
            orderBy: { createdAt: 'desc' },
          });
          
          if (createdIntent) {
            await prisma.productIntent.update({
              where: { id: createdIntent.id },
              data: {
                firstSeenAt,
                lastSeenAt,
              },
            });
          }
        }
        
        customerProducts.push(product.id);
        totalIntents++;
      } catch (error) {
        console.error(`Error creating intent for ${scenario.profileId}:`, error);
      }
    }
    
    if (customerProducts.length > 0) {
      profileIntents.set(scenario.profileId, customerProducts);
    }
  }
  
  console.log(`✅ Generated ${totalIntents} product intents`);
  return profileIntents;
}

/**
 * Generate store visits linked to product intents
 */
async function generateStoreVisitsLinkedToIntents(
  scenarios: CustomerScenario[],
  profileIntents: Map<string, string[]>
): Promise<Map<string, string>> {
  console.log('Generating store visits linked to product intents...');
  
  const visitProfileMap = new Map<string, string>(); // visitId -> profileId
  let totalVisits = 0;
  
  // 35% of customers with intents visit stores
  const visitCandidates = Array.from(profileIntents.keys()).filter(() => Math.random() < 0.35);
  
  for (const profileId of visitCandidates) {
    const scenario = scenarios.find(s => s.profileId === profileId);
    if (!scenario) continue;
    
    const store = randomElement(stores);
    const detectionMethod = randomElement(['geofence', 'qr_scan', 'pos_lookup', 'checkin'] as const);
    
    // Visit happens 0-14 days after last intent
    const daysAgo = randomInt(0, 14);
    const checkInAt = new Date();
    checkInAt.setDate(checkInAt.getDate() - daysAgo);
    
    try {
      const result = await detectStoreVisit({
        brandId: BRAND_ID,
        storeId: store.id,
        storeName: store.name,
        detectionMethod,
        location: {
          lat: randomFloat(37.7, 37.8),
          lng: randomFloat(-122.5, -122.4),
          accuracy: randomFloat(10, 50),
        },
        phone: scenario.identifiers.phone,
        email: scenario.identifiers.email,
        deviceId: scenario.identifiers.deviceId,
        loyaltyId: scenario.identifiers.loyaltyId,
      });
      
      if (result.visitId) {
        visitProfileMap.set(result.visitId, profileId);
        totalVisits++;
      }
    } catch (error) {
      console.error(`Error creating store visit for ${profileId}:`, error);
    }
  }
  
  console.log(`✅ Generated ${totalVisits} store visits`);
  return visitProfileMap;
}

/**
 * Generate purchase events with conversions
 */
async function generatePurchaseEventsWithConversions(
  scenarios: CustomerScenario[],
  profileIntents: Map<string, string[]>,
  visitProfileMap: Map<string, string>
): Promise<void> {
  console.log('Generating purchase events with conversions...');
  
  let totalPurchases = 0;
  let convertedIntents = 0;
  
  // 60% of customers make purchases
  const purchaseCandidates = scenarios.filter(() => Math.random() < 0.6);
  
  for (const scenario of purchaseCandidates) {
    const customerIntents = profileIntents.get(scenario.profileId) || [];
    const hasVisitedStore = Array.from(visitProfileMap.values()).includes(scenario.profileId);
    
    // Determine purchase scenario
    const purchaseScenario = randomElement([
      'converts_intent',      // Purchases product they viewed online
      'converts_intent',      // Higher chance
      'offline_only',         // Purchases product they never viewed
      'mixed',                // Mix of both
    ]);
    
    const itemCount = randomInt(1, 4);
    const items: any[] = [];
    let total = 0;
    
    for (let i = 0; i < itemCount; i++) {
      let product: typeof products[0];
      let convertsIntent = false;
      
      if (purchaseScenario === 'converts_intent' && customerIntents.length > 0 && Math.random() > 0.3) {
        // Convert an intent
        const intentProductId = randomElement(customerIntents);
        product = products.find(p => p.id === intentProductId) || randomElement(products);
        convertsIntent = true;
      } else if (purchaseScenario === 'offline_only' || (purchaseScenario === 'mixed' && Math.random() > 0.5)) {
        // Offline-only purchase
        product = randomElement(products);
      } else {
        // Default: random product
        product = randomElement(products);
      }
      
      const productRecord = await prisma.product.findUnique({
        where: { productId: product.id },
      });
      
      if (!productRecord) continue;
      
      const quantity = randomInt(1, 2);
      const price = product.price;
      const itemTotal = price * quantity;
      total += itemTotal;
      
      items.push({
        product_id: product.id,
        name: product.name,
        category: product.category,
        quantity,
        price,
        total: itemTotal,
      });
      
      // Mark intent as converted if applicable
      if (convertsIntent && customerIntents.includes(product.id)) {
        try {
          await markIntentAsConverted(BRAND_ID, scenario.profileId, productRecord.id);
          convertedIntents++;
        } catch (error) {
          // Intent might not exist or already converted
        }
      }
    }
    
    // Purchase timing: some recent (7 days), some older (30 days)
    const daysAgo = randomInt(0, 30);
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - daysAgo);
    
    // Determine if it's a store purchase or online purchase
    const isStorePurchase = hasVisitedStore && Math.random() > 0.4;
    const eventType = isStorePurchase ? 'pos_transaction' : 'purchase';
    
    try {
      await ingestEvent({
        brandId: BRAND_ID,
        eventType,
        payload: {
          order_id: `ORD${randomInt(100000, 999999)}`,
          total,
          items,
          payment_method: randomElement(['card', 'cash', 'paypal', 'apple_pay']),
          store_id: isStorePurchase ? randomElement(stores).id : undefined,
          timestamp: createdAt.toISOString(),
        },
      });
      
      totalPurchases++;
    } catch (error) {
      console.error(`Error creating purchase event:`, error);
    }
  }
  
  console.log(`✅ Generated ${totalPurchases} purchase events`);
  console.log(`   - ${convertedIntents} intents converted to purchases`);
}

/**
 * Generate planogram-specific test scenarios
 */
async function generatePlanogramTestScenarios(
  scenarios: CustomerScenario[],
  profileIntents: Map<string, string[]>
): Promise<void> {
  console.log('Generating planogram-specific test scenarios...');
  
  // Scenario 1: High intent, low sales products (Home category)
  const homeProducts = products.filter(p => p.category === 'Home');
  const homeProductRecords = await Promise.all(
    homeProducts.map(p => prisma.product.findUnique({ where: { productId: p.id } }))
  );
  
  // Create many intents for home products but few purchases
  const homeIntentProfiles = scenarios.slice(0, Math.floor(scenarios.length * 0.4));
  for (const scenario of homeIntentProfiles) {
    const product = randomElement(homeProducts);
    const productRecord = await prisma.product.findUnique({
      where: { productId: product.id },
    });
    
    if (productRecord) {
      await trackProductIntent({
        brandId: BRAND_ID,
        profileId: scenario.profileId,
        productId: productRecord.id,
        productName: product.name,
        category: product.category,
        intentType: 'product_view',
        sourceChannel: 'web',
        viewDuration: randomInt(60, 240),
      });
    }
  }
  
  // Scenario 2: Rising interest products (Sports category - more recent intents)
  const sportsProducts = products.filter(p => p.category === 'Sports');
  const recentProfiles = scenarios.slice(0, Math.floor(scenarios.length * 0.3));
  
  for (const scenario of recentProfiles) {
    const product = randomElement(sportsProducts);
    const productRecord = await prisma.product.findUnique({
      where: { productId: product.id },
    });
    
    if (productRecord) {
      // Recent intent (0-7 days)
      await trackProductIntent({
        brandId: BRAND_ID,
        profileId: scenario.profileId,
        productId: productRecord.id,
        productName: product.name,
        category: product.category,
        intentType: Math.random() > 0.5 ? 'product_search' : 'product_view',
        sourceChannel: 'web',
        viewDuration: randomInt(90, 300),
        searchQuery: Math.random() > 0.5 ? product.name : undefined,
      });
    }
  }
  
  // Scenario 3: Low intent, high sales (Electronics - some products)
  // This will be handled by purchase events generating more sales than intents
  
  console.log(`✅ Generated planogram test scenarios`);
  console.log(`   - High intent/low sales: Home category`);
  console.log(`   - Rising interest: Sports category`);
  console.log(`   - Low intent/high sales: Electronics (via purchases)`);
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const customerCount = args[0] ? parseInt(args[0]) : 300; // Default to 300 (medium)
  
  console.log('🎲 Generating Real-World Mock Data...');
  console.log(`Brand ID: ${BRAND_ID}`);
  console.log(`Customers: ${customerCount}`);
  console.log('');
  
  const startTime = Date.now();
  
  try {
    // Step 1: Ensure products exist
    await ensureProductsExist();
    console.log('');
    
    // Step 2: Generate customer profiles with merge scenarios
    const scenarios = await generateCustomerProfilesWithMergeScenarios(customerCount);
    console.log('');
    
    // Step 3: Generate product intents with realistic patterns
    const profileIntents = await generateProductIntentsWithRealisticPatterns(scenarios);
    console.log('');
    
    // Step 4: Generate store visits linked to intents
    const visitProfileMap = await generateStoreVisitsLinkedToIntents(scenarios, profileIntents);
    console.log('');
    
    // Step 5: Generate purchase events with conversions
    await generatePurchaseEventsWithConversions(scenarios, profileIntents, visitProfileMap);
    console.log('');
    
    // Step 6: Generate planogram-specific scenarios
    await generatePlanogramTestScenarios(scenarios, profileIntents);
    console.log('');
    
    // Summary
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    const stats = {
      profiles: await prisma.customerProfile.count({ where: { brandId: BRAND_ID } }),
      intents: await prisma.productIntent.count({ where: { brandId: BRAND_ID } }),
      storeVisits: await prisma.storeVisit.count({ where: { brandId: BRAND_ID } }),
      purchaseEvents: await prisma.customerRawEvent.count({
        where: {
          brandId: BRAND_ID,
          eventType: { in: ['purchase', 'pos_transaction'] },
        },
      }),
      products: await prisma.product.count({ where: { brandId: BRAND_ID } }),
    };
    
    console.log('📊 Summary:');
    console.log(`  Total Profiles: ${stats.profiles}`);
    console.log(`  Product Intents: ${stats.intents}`);
    console.log(`  Store Visits: ${stats.storeVisits}`);
    console.log(`  Purchase Events: ${stats.purchaseEvents}`);
    console.log(`  Products: ${stats.products}`);
    console.log(`  Duration: ${duration} seconds`);
    console.log('');
    console.log('✅ Real-world mock data generation complete!');
    console.log('');
    console.log('🧪 Test Scenarios Enabled:');
    console.log('  - Profile merging (check for merged profiles)');
    console.log('  - Product intent tracking (view intents per customer)');
    console.log('  - Store visit alerts (customers with high intent visiting stores)');
    console.log('  - Planogram intelligence (online intent vs offline sales)');
    console.log('  - Customer 360 view (unified customer journey)');
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

export { generateCustomerProfilesWithMergeScenarios, generateProductIntentsWithRealisticPatterns };

