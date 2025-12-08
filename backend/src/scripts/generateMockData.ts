// GENERATOR: MOCK_DATA_GENERATOR
// ASSUMPTIONS: Prisma client, database connected, DATABASE_URL in env
// HOW TO RUN: tsx src/scripts/generateMockData.ts [--brand-id=test-brand] [--customers=150] [--days=90] [--clear]

import { getPrismaClient } from '../db/prismaClient';
import { ingestEvent } from '../services/ingestion/eventIngestion';
import { createCampaign } from '../services/campaign/campaignService';
import { createAutomation } from '../services/automation/automationService';
import { detectStoreVisit } from '../services/store/storeVisitService';

const prisma = getPrismaClient();

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (key: string, defaultValue: string): string => {
  const arg = args.find(a => a.startsWith(`--${key}=`));
  return arg ? arg.split('=')[1] : defaultValue;
};
const hasFlag = (flag: string): boolean => args.includes(`--${flag}`);

// Get brand ID - if 'test-brand' is specified, find the actual test brand ID
let BRAND_ID = getArg('brand-id', 'test-brand');
const CUSTOMER_COUNT = parseInt(getArg('customers', '150'), 10);
const DAYS = parseInt(getArg('days', '90'), 10);
const CLEAR_EXISTING = hasFlag('clear');

// Helper to get test brand ID if needed
async function getTestBrandId(): Promise<string> {
  if (BRAND_ID === 'test-brand') {
    const testBrand = await prisma.brand.findFirst({
      where: { name: 'Test Brand' },
    });
    if (testBrand) {
      return testBrand.id;
    }
  }
  return BRAND_ID;
}

// Product categories and names
const PRODUCT_CATEGORIES = ['Apparel', 'Footwear', 'Accessories', 'Electronics', 'Home & Living'];
const PRODUCT_NAMES = {
  'Apparel': ['T-Shirt', 'Jeans', 'Jacket', 'Dress', 'Sweater', 'Shorts', 'Pants', 'Blouse'],
  'Footwear': ['Sneakers', 'Boots', 'Sandals', 'Heels', 'Loafers', 'Running Shoes'],
  'Accessories': ['Watch', 'Bag', 'Belt', 'Hat', 'Sunglasses', 'Jewelry'],
  'Electronics': ['Headphones', 'Speaker', 'Charger', 'Cable', 'Case'],
  'Home & Living': ['Candle', 'Vase', 'Pillow', 'Rug', 'Lamp', 'Frame']
};

// Store locations
const STORES = [
  { id: 'STORE-001', name: 'Downtown Location', city: 'New York' },
  { id: 'STORE-002', name: 'Mall Location', city: 'Los Angeles' },
  { id: 'STORE-003', name: 'Outlet Location', city: 'Chicago' },
  { id: 'STORE-004', name: 'Flagship Store', city: 'Miami' },
  { id: 'STORE-005', name: 'Airport Location', city: 'San Francisco' }
];

// Payment methods
const PAYMENT_METHODS = ['credit_card', 'debit_card', 'paypal', 'apple_pay', 'google_pay', 'cash', 'store_credit'];

// Customer segments
const SEGMENTS = ['champion', 'loyal', 'at_risk', 'new', 'potential'];

interface CustomerProfile {
  id: string;
  email: string;
  phone: string;
  loyaltyId: string;
  deviceId?: string;
  cookieId?: string;
  segment: string;
  profileStrength: number;
}

/**
 * Generate random email
 */
function generateEmail(index: number): string {
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'company.com'];
  const names = ['john', 'jane', 'mike', 'sarah', 'david', 'emma', 'chris', 'lisa', 'alex', 'maria'];
  const randomName = names[Math.floor(Math.random() * names.length)];
  return `${randomName}.${index}@${domains[Math.floor(Math.random() * domains.length)]}`;
}

/**
 * Generate random phone number
 */
function generatePhone(index: number): string {
  const areaCodes = ['555', '212', '310', '312', '415', '646', '917'];
  const areaCode = areaCodes[Math.floor(Math.random() * areaCodes.length)];
  // Generate 7-digit number (area code + 7 digits = 10 digits total)
  const number = String(1000000 + (index % 1000000)).padStart(7, '0');
  return `+1${areaCode}${number}`;
}

/**
 * Generate random date within last N days (more recent = higher probability)
 */
function randomDateInPast(days: number): Date {
  const now = Date.now();
  const daysAgo = Math.random() * days;
  // Exponential decay - more recent events
  const decayFactor = Math.pow(Math.random(), 0.5);
  const actualDaysAgo = daysAgo * decayFactor;
  return new Date(now - actualDaysAgo * 24 * 60 * 60 * 1000);
}

/**
 * Generate random business hours timestamp
 */
function randomBusinessHours(baseDate: Date): Date {
  const hour = 9 + Math.floor(Math.random() * 9); // 9 AM - 6 PM
  const minute = Math.floor(Math.random() * 60);
  const date = new Date(baseDate);
  date.setHours(hour, minute, 0, 0);
  return date;
}

/**
 * Generate customer profiles
 */
async function generateCustomers(count: number): Promise<CustomerProfile[]> {
  console.log(`\n👥 Generating ${count} customer profiles...`);
  const profiles: CustomerProfile[] = [];
  
  for (let i = 0; i < count; i++) {
    const email = generateEmail(i);
    const phone = generatePhone(i);
    const loyaltyId = `LOY-${String(100000 + i).padStart(6, '0')}`;
    const segment = SEGMENTS[Math.floor(Math.random() * SEGMENTS.length)];
    const profileStrength = 40 + Math.floor(Math.random() * 55); // 40-95%
    
    // Generate device and cookie IDs for this customer
    const deviceId = `device-${Math.random().toString(36).substr(2, 12)}`;
    const cookieId = `cookie-${Math.random().toString(36).substr(2, 12)}`;
    
    // Create initial profile via event ingestion with all identifiers
    const result = await ingestEvent({
      brandId: BRAND_ID,
      eventType: 'page_view',
      payload: {
        email: email,
        phone: phone,
        loyalty_id: loyaltyId,
        device_id: deviceId,
        cookie_id: cookieId,
        page_url: 'https://store.com',
        timestamp: randomDateInPast(DAYS).toISOString(),
      },
    });
    
    if (result.profileId) {
      // Ensure all identifiers are saved to the profile
      await prisma.customerProfile.update({
        where: { id: result.profileId },
        data: {
          identifiers: {
            email: email,
            phone: phone,
            loyalty_id: loyaltyId,
            device_id: deviceId,
            cookie_id: cookieId,
          },
          profileStrength: profileStrength,
        },
      });
      
      profiles.push({
        id: result.profileId,
        email,
        phone,
        loyaltyId,
        deviceId,
        cookieId,
        segment,
        profileStrength,
      });
    }
    
    if ((i + 1) % 25 === 0) {
      console.log(`   ✅ Generated ${i + 1}/${count} profiles...`);
    }
  }
  
  console.log(`   ✅ Generated ${profiles.length} customer profiles`);
  return profiles;
}

/**
 * Generate products
 */
async function generateProducts(brandId: string, count: number = 25): Promise<any[]> {
  console.log(`\n📦 Generating ${count} products...`);
  const products: any[] = [];
  
  for (let i = 0; i < count; i++) {
    const category = PRODUCT_CATEGORIES[Math.floor(Math.random() * PRODUCT_CATEGORIES.length)];
    const productNames = PRODUCT_NAMES[category as keyof typeof PRODUCT_NAMES];
    const productName = productNames[Math.floor(Math.random() * productNames.length)];
    const productId = `PROD-${String(1000 + i).padStart(4, '0')}`;
    const price = (20 + Math.random() * 200).toFixed(2);
    
    try {
      const product = await prisma.product.upsert({
        where: { productId: productId },
        update: {},
        create: {
          productId: productId,
          brandId,
          name: `${productName} ${i + 1}`,
          category,
          price: parseFloat(price),
          currency: 'USD',
          active: true,
        },
      });
      products.push(product);
    } catch (error) {
      // Product might already exist, continue
    }
  }
  
  console.log(`   ✅ Generated ${products.length} products`);
  return products;
}

/**
 * Generate events over time
 */
async function generateEventsOverTime(profiles: CustomerProfile[], products: any[], days: number): Promise<void> {
  console.log(`\n📅 Generating events over last ${days} days...`);
  
  const totalEvents = profiles.length * 8; // Average 8 events per customer
  let eventsGenerated = 0;
  
  // Event type distribution - More realistic with higher purchase weight
  const eventTypes = [
    { type: 'purchase', weight: 0.35, channel: 'shopify' },
    { type: 'page_view', weight: 0.20, channel: 'website' },
    { type: 'cart_add', weight: 0.15, channel: 'website' },
    { type: 'whatsapp_message', weight: 0.10, channel: 'whatsapp' },
    { type: 'store_visit', weight: 0.10, channel: 'pos' },
    { type: 'product_view', weight: 0.10, channel: 'website' },
  ];
  
  for (const profile of profiles) {
    const profileEvents = 5 + Math.floor(Math.random() * 10); // 5-15 events per profile
    
    for (let i = 0; i < profileEvents; i++) {
      // Select event type based on weight
      const rand = Math.random();
      let cumulative = 0;
      let selectedEvent = eventTypes[0];
      for (const eventType of eventTypes) {
        cumulative += eventType.weight;
        if (rand <= cumulative) {
          selectedEvent = eventType;
          break;
        }
      }
      
      const eventDate = randomDateInPast(days);
      const product = products[Math.floor(Math.random() * products.length)];
      
      try {
        switch (selectedEvent.type) {
          case 'purchase':
            // Generate more realistic order data
            const itemCount = 1 + Math.floor(Math.random() * 3);
            const selectedProducts = [];
            for (let i = 0; i < itemCount; i++) {
              selectedProducts.push(products[Math.floor(Math.random() * products.length)]);
            }
            
            const subtotal = selectedProducts.reduce((sum, p) => sum + (Number(p.price) || 0), 0);
            const tax = subtotal * 0.08;
            const shipping = subtotal > 100 ? 0 : 5.99;
            const total = subtotal + tax + shipping;
            
            await ingestEvent({
              brandId: BRAND_ID,
              eventType: 'purchase',
              payload: {
                id: 10000 + eventsGenerated,
                order_number: `ORD-${10000 + eventsGenerated}`,
                email: profile.email,
                phone: Math.random() > 0.3 ? profile.phone : undefined,
                loyalty_id: Math.random() > 0.5 ? profile.loyaltyId : undefined,
                total_spent: total.toFixed(2),
                subtotal: subtotal.toFixed(2),
                tax: tax.toFixed(2),
                shipping: shipping.toFixed(2),
                currency: 'USD',
                financial_status: 'paid',
                fulfillment_status: ['pending', 'processing', 'shipped', 'delivered'][Math.floor(Math.random() * 4)],
                payment_method: PAYMENT_METHODS[Math.floor(Math.random() * PAYMENT_METHODS.length)],
                line_items: selectedProducts.map((p, idx) => ({
                  id: `item-${10000 + eventsGenerated}-${idx}`,
                  product_id: p.productId,
                  product_name: p.name,
                  category: p.category || 'General',
                  price: Number(p.price).toFixed(2),
                  quantity: 1 + Math.floor(Math.random() * 2),
                  sku: `SKU-${p.productId}`,
                })),
                created_at: eventDate.toISOString(),
                source: 'shopify',
              },
            });
            break;
            
          case 'page_view':
            await ingestEvent({
              brandId: BRAND_ID,
              eventType: 'page_view',
              payload: {
                email: Math.random() > 0.4 ? profile.email : undefined,
                phone: Math.random() > 0.6 ? profile.phone : undefined,
                device_id: profile.deviceId,
                cookie_id: profile.cookieId,
                page_url: `https://store.com/products/${product.productId}`,
                timestamp: eventDate.toISOString(),
              },
            });
            break;
            
          case 'cart_add':
            await ingestEvent({
              brandId: BRAND_ID,
              eventType: 'cart_add',
              payload: {
                product_id: product.productId,
                product_name: product.name,
                category: product.category,
                price: (Number(product.price) || 0).toFixed(2),
                session_id: `sess-${Math.random().toString(36).substr(2, 9)}`,
                page_url: `https://store.com/products/${product.productId}`,
                email: Math.random() > 0.5 ? profile.email : undefined,
                device_id: profile.deviceId,
                cookie_id: profile.cookieId,
                timestamp: eventDate.toISOString(),
              },
            });
            break;
            
          case 'whatsapp_message':
            await ingestEvent({
              brandId: BRAND_ID,
              eventType: 'whatsapp_message',
              payload: {
                MessageSid: `SM${Math.random().toString(36).substr(2, 9)}`,
                From: `whatsapp:${profile.phone}`,
                To: 'whatsapp:+15559999',
                Body: ['When will my order ship?', 'Do you have this in stock?', 'What is the return policy?'][Math.floor(Math.random() * 3)],
                MessageStatus: 'received',
                AccountSid: 'ACxxxxx',
                phone: profile.phone,
                whatsapp: profile.phone,
                timestamp: eventDate.toISOString(),
              },
            });
            break;
            
          case 'store_visit':
            const store = STORES[Math.floor(Math.random() * STORES.length)];
            await ingestEvent({
              brandId: BRAND_ID,
              eventType: 'store_visit',
              payload: {
                store_id: store.id,
                store_name: store.name,
                loyalty_id: Math.random() > 0.4 ? profile.loyaltyId : undefined,
                phone: Math.random() > 0.3 ? profile.phone : undefined,
                check_in_at: randomBusinessHours(eventDate).toISOString(),
                check_out_at: new Date(randomBusinessHours(eventDate).getTime() + 30 * 60 * 1000).toISOString(),
                detection_method: ['qr_scan', 'beacon', 'wifi'][Math.floor(Math.random() * 3)],
              },
            });
            break;
            
          case 'product_view':
            await ingestEvent({
              brandId: BRAND_ID,
              eventType: 'product_view',
              payload: {
                product_id: product.productId,
                product_name: product.name,
                category: product.category,
                email: Math.random() > 0.5 ? profile.email : undefined,
                page_url: `https://store.com/products/${product.productId}`,
                view_duration: 30 + Math.floor(Math.random() * 300),
                timestamp: eventDate.toISOString(),
              },
            });
            break;
        }
        
        eventsGenerated++;
        if (eventsGenerated % 100 === 0) {
          console.log(`   ✅ Generated ${eventsGenerated}/${totalEvents} events...`);
        }
      } catch (error) {
        // Continue on error
      }
    }
  }
  
  console.log(`   ✅ Generated ${eventsGenerated} events`);
}

/**
 * Generate campaigns
 */
async function generateCampaigns(brandId: string): Promise<void> {
  console.log(`\n📢 Generating campaigns...`);
  
  const campaigns = [
    {
      name: 'Welcome Campaign',
      description: 'Welcome new customers',
      campaignType: 'one_time' as const,
      targetChannels: ['email'],
      messageTemplate: {
        subject: 'Welcome to our store!',
        body: 'Thank you for joining us. Get 10% off your first order with code WELCOME10.',
      },
      status: 'active',
    },
    {
      name: 'Summer Sale',
      description: 'Summer collection promotion',
      campaignType: 'one_time' as const,
      targetChannels: ['email', 'whatsapp'],
      messageTemplate: {
        subject: 'Summer Sale - Up to 50% Off!',
        body: 'Check out our summer collection with amazing discounts.',
      },
      status: 'active',
    },
    {
      name: 'Abandoned Cart Recovery',
      description: 'Recover abandoned carts',
      campaignType: 'triggered' as const,
      targetChannels: ['email', 'whatsapp'],
      messageTemplate: {
        subject: 'Complete your purchase',
        body: 'You left items in your cart. Complete your purchase now!',
      },
      status: 'active',
    },
    {
      name: 'VIP Exclusive',
      description: 'VIP customer exclusive offers',
      campaignType: 'recurring' as const,
      schedule: {
        frequency: 'monthly',
        time_of_day: '10:00',
      },
      targetChannels: ['email'],
      messageTemplate: {
        subject: 'VIP Exclusive Offer',
        body: 'As a VIP member, here is your exclusive offer.',
      },
      status: 'scheduled',
    },
    {
      name: 'Flash Sale',
      description: 'Limited time flash sale',
      campaignType: 'one_time' as const,
      targetChannels: ['whatsapp', 'sms'],
      messageTemplate: {
        subject: 'Flash Sale - 24 Hours Only!',
        body: 'Hurry! Flash sale ends in 24 hours. Shop now!',
      },
      status: 'completed',
    },
  ];
  
  for (const campaignData of campaigns) {
    try {
      const campaignId = await createCampaign({
        brandId,
        name: campaignData.name,
        description: campaignData.description,
        campaignType: campaignData.campaignType,
        schedule: campaignData.schedule,
        targetChannels: campaignData.targetChannels,
        messageTemplate: campaignData.messageTemplate,
      });
      
      // Update status
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { status: campaignData.status },
      });
      
      console.log(`   ✅ Created campaign: ${campaignData.name}`);
    } catch (error) {
      console.error(`   ⚠️  Error creating campaign ${campaignData.name}:`, error);
    }
  }
  
  console.log(`   ✅ Generated ${campaigns.length} campaigns`);
}

/**
 * Generate automations
 */
async function generateAutomations(brandId: string): Promise<void> {
  console.log(`\n⚙️  Generating automations...`);
  
  const automations = [
    {
      name: 'Cart Abandonment',
      description: 'Send reminder when cart is abandoned',
      trigger: {
        type: 'cart_abandonment' as const,
        time_window: 2, // 2 hours
      },
      actions: [{
        type: 'send_email' as const,
        channel: 'email' as const,
        subject: 'Complete your purchase',
        message: 'You left items in your cart. Complete your purchase now!',
        delay_minutes: 120,
      }],
    },
    {
      name: 'Churn Risk Alert',
      description: 'Re-engage at-risk customers',
      trigger: {
        type: 'churn_risk' as const,
        threshold: 70,
      },
      actions: [{
        type: 'send_message' as const,
        channel: 'whatsapp' as const,
        message: 'We miss you! Here is a special offer just for you.',
      }],
    },
    {
      name: 'Welcome Automation',
      description: 'Welcome new customers',
      trigger: {
        type: 'custom' as const,
        event_type: 'purchase',
      },
      conditions: {
        segment: 'new',
      },
      actions: [{
        type: 'send_email' as const,
        channel: 'email' as const,
        subject: 'Welcome!',
        message: 'Thank you for your first purchase!',
      }],
    },
    {
      name: 'High Intent Follow-up',
      description: 'Follow up on high product intent',
      trigger: {
        type: 'product_intent' as const,
        threshold: 80,
      },
      actions: [{
        type: 'send_message' as const,
        channel: 'whatsapp' as const,
        message: 'Still interested in {product_name}? Get 15% off today!',
      }],
    },
  ];
  
  for (const automationData of automations) {
    try {
      await createAutomation({
        brandId,
        name: automationData.name,
        description: automationData.description,
        trigger: automationData.trigger,
        conditions: automationData.conditions,
        actions: automationData.actions,
        enabled: true,
      });
      
      console.log(`   ✅ Created automation: ${automationData.name}`);
    } catch (error) {
      console.error(`   ⚠️  Error creating automation ${automationData.name}:`, error);
    }
  }
  
  console.log(`   ✅ Generated ${automations.length} automations`);
}

/**
 * Generate store visits
 */
async function generateStoreVisits(profiles: CustomerProfile[]): Promise<void> {
  console.log(`\n🏪 Generating store visits...`);
  
  const visitCount = 20 + Math.floor(Math.random() * 15); // 20-35 visits
  let visitsGenerated = 0;
  
  for (let i = 0; i < visitCount; i++) {
    const profile = profiles[Math.floor(Math.random() * profiles.length)];
    const store = STORES[Math.floor(Math.random() * STORES.length)];
    const visitDate = randomDateInPast(DAYS);
    
    try {
      await detectStoreVisit({
        brandId: BRAND_ID,
        storeId: store.id,
        storeName: store.name,
        detectionMethod: ['qr_scan', 'beacon', 'wifi', 'pos'][Math.floor(Math.random() * 4)],
        phone: Math.random() > 0.3 ? profile.phone : undefined,
        email: Math.random() > 0.4 ? profile.email : undefined,
        loyaltyId: Math.random() > 0.5 ? profile.loyaltyId : undefined,
      });
      
      visitsGenerated++;
    } catch (error) {
      // Continue on error
    }
  }
  
  console.log(`   ✅ Generated ${visitsGenerated} store visits`);
}

/**
 * Generate ML predictions for profiles
 */
async function generateMLPredictions(profiles: CustomerProfile[]): Promise<void> {
  console.log(`\n🔮 Generating ML predictions...`);
  
  let predictionsGenerated = 0;
  
  for (const profile of profiles) {
    try {
      // Get profile with events to calculate realistic predictions
      const profileData = await prisma.customerProfile.findUnique({
        where: { id: profile.id },
        include: {
          rawEvents: {
            where: { eventType: 'purchase' },
          },
        },
      });
      
      if (!profileData) continue;
      
      const purchaseCount = profileData.rawEvents.length;
      const daysSinceLastPurchase = profileData.rawEvents.length > 0
        ? Math.floor((Date.now() - new Date(profileData.rawEvents[0].createdAt).getTime()) / (1000 * 60 * 60 * 24))
        : 90;
      
      // Calculate realistic churn risk
      let churnRisk = 0;
      if (daysSinceLastPurchase > 60) churnRisk = 70 + Math.random() * 30;
      else if (daysSinceLastPurchase > 30) churnRisk = 40 + Math.random() * 30;
      else if (daysSinceLastPurchase > 14) churnRisk = 20 + Math.random() * 20;
      else churnRisk = Math.random() * 20;
      
      // Calculate predicted LTV based on purchase history
      let totalSpent = 0;
      profileData.rawEvents.forEach(event => {
        const payload = event.payload as any;
        if (payload.total_spent) {
          totalSpent += parseFloat(payload.total_spent);
        }
      });
      const avgOrderValue = purchaseCount > 0 ? totalSpent / purchaseCount : 0;
      const predictedLTV = avgOrderValue * (2 + Math.random() * 8);
      
      // Determine segment
      let segment = 'new';
      if (purchaseCount >= 5 && churnRisk < 30) segment = 'champion';
      else if (purchaseCount >= 3 && churnRisk < 50) segment = 'loyal';
      else if (churnRisk > 60) segment = 'at_risk';
      else if (purchaseCount > 0) segment = 'potential';
      
      // Generate product recommendations (using actual products if available)
      const allProducts = await prisma.product.findMany({ where: { brandId: BRAND_ID }, take: 10 });
      const recommendations = allProducts.slice(0, 3).map((p, i) => ({
        product_id: p.productId,
        name: p.name,
        score: 0.7 + Math.random() * 0.3,
      }));
      
      // Upsert prediction (using Prediction model from schema)
      await prisma.prediction.upsert({
        where: { profileId: profile.id },
        update: {
          churnScore: churnRisk / 100,
          ltvScore: predictedLTV,
          segment: segment,
          recommendations: recommendations as any,
          modelVersion: 'v1.0',
          updatedAt: new Date(),
        },
        create: {
          profileId: profile.id,
          churnScore: churnRisk / 100,
          ltvScore: predictedLTV,
          segment: segment,
          recommendations: recommendations as any,
          modelVersion: 'v1.0',
        },
      });
      
      predictionsGenerated++;
      if (predictionsGenerated % 25 === 0) {
        console.log(`   ✅ Generated ${predictionsGenerated}/${profiles.length} predictions...`);
      }
    } catch (error) {
      // Continue on error
    }
  }
  
  console.log(`   ✅ Generated ${predictionsGenerated} ML predictions`);
}

/**
 * Clear existing data
 */
async function clearExistingData(): Promise<void> {
  console.log(`\n🗑️  Clearing existing data for brand ${BRAND_ID}...`);
  
  try {
    // Delete in order to respect foreign keys
    await prisma.campaignExecution.deleteMany({ where: { campaign: { brandId: BRAND_ID } } });
    await prisma.campaign.deleteMany({ where: { brandId: BRAND_ID } });
    await prisma.marketingAutomation.deleteMany({ where: { brandId: BRAND_ID } });
    await prisma.storeVisit.deleteMany({ where: { brandId: BRAND_ID } });
    await prisma.productIntent.deleteMany({ where: { brandId: BRAND_ID } });
    await prisma.mlPrediction.deleteMany({ where: { profile: { brandId: BRAND_ID } } });
    await prisma.customerRawEvent.deleteMany({ where: { brandId: BRAND_ID } });
    await prisma.customerProfile.deleteMany({ where: { brandId: BRAND_ID } });
    await prisma.product.deleteMany({ where: { brandId: BRAND_ID } });
    
    console.log(`   ✅ Cleared existing data`);
  } catch (error) {
    console.error(`   ⚠️  Error clearing data:`, error);
  }
}

/**
 * Main function
 */
async function main() {
  // Resolve test brand ID if needed
  const actualBrandId = await getTestBrandId();
  BRAND_ID = actualBrandId;
  
  console.log('🚀 Mock Data Generator for ConstIntel\n');
  console.log(`Configuration:`);
  console.log(`  Brand ID: ${BRAND_ID}`);
  console.log(`  Customers: ${CUSTOMER_COUNT}`);
  console.log(`  Days: ${DAYS}`);
  console.log(`  Clear existing: ${CLEAR_EXISTING}\n`);
  
  try {
    if (CLEAR_EXISTING) {
      await clearExistingData();
    }
    
    // Generate products first
    const products = await generateProducts(BRAND_ID, 25);
    
    // Generate customers
    const profiles = await generateCustomers(CUSTOMER_COUNT);
    
    // Generate events over time
    await generateEventsOverTime(profiles, products, DAYS);
    
    // Generate campaigns
    await generateCampaigns(BRAND_ID);
    
    // Generate automations
    await generateAutomations(BRAND_ID);
    
    // Generate store visits
    await generateStoreVisits(profiles);
    
    // Generate ML predictions
    await generateMLPredictions(profiles);
    
    console.log('\n✅ Mock data generation complete!');
    console.log(`\n📊 Summary:`);
    console.log(`  - Customers: ${profiles.length}`);
    console.log(`  - Products: ${products.length}`);
    console.log(`  - Events: Generated across ${DAYS} days`);
    console.log(`  - Campaigns: 5`);
    console.log(`  - Automations: 4`);
    console.log(`  - Store Visits: 20-35`);
    console.log(`  - ML Predictions: ${profiles.length}`);
    console.log(`\n🎯 Your dashboards should now be populated with realistic data!`);
    
  } catch (error) {
    console.error('❌ Error generating mock data:', error);
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

