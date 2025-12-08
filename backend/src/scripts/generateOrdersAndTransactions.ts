// GENERATOR: ORDERS_AND_TRANSACTIONS
// Generate realistic order and transaction data with processing flow documentation
// HOW TO RUN: tsx src/scripts/generateOrdersAndTransactions.ts [--brand-id=test-brand] [--orders=500] [--days=90]

import { getPrismaClient } from '../db/prismaClient';
import { ingestEvent } from '../services/ingestion/eventIngestion';
import { processPOSEvent } from '../services/integrations/pos';
import { updateProfileStatistics } from '../services/profile/profileStatisticsService';

const prisma = getPrismaClient();

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (key: string, defaultValue: string): string => {
  const arg = args.find(a => a.startsWith(`--${key}=`));
  return arg ? arg.split('=')[1] : defaultValue;
};

let BRAND_ID = getArg('brand-id', 'test-brand');
const ORDER_COUNT = parseInt(getArg('orders', '500'), 10);
const DAYS = parseInt(getArg('days', '90'), 10);

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

// Payment methods
const PAYMENT_METHODS = ['credit_card', 'debit_card', 'paypal', 'apple_pay', 'google_pay', 'cash', 'store_credit'];
const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
const CHANNELS = ['shopify', 'pos', 'woocommerce', 'website', 'mobile_app'];

// Order scenarios
const ORDER_SCENARIOS = [
  {
    name: 'Single Item Purchase',
    weight: 0.4,
    itemCount: () => 1,
    channel: 'shopify',
  },
  {
    name: 'Multi-Item Purchase',
    weight: 0.3,
    itemCount: () => 2 + Math.floor(Math.random() * 4),
    channel: 'shopify',
  },
  {
    name: 'POS Store Purchase',
    weight: 0.2,
    itemCount: () => 1 + Math.floor(Math.random() * 3),
    channel: 'pos',
  },
  {
    name: 'High-Value Purchase',
    weight: 0.1,
    itemCount: () => 1 + Math.floor(Math.random() * 2),
    channel: 'shopify',
    multiplier: 3, // Higher value
  },
];

/**
 * Generate random date in past (more recent = higher probability)
 */
function randomDateInPast(days: number): Date {
  const now = Date.now();
  const daysAgo = Math.random() * days;
  const decayFactor = Math.pow(Math.random(), 0.5);
  const actualDaysAgo = daysAgo * decayFactor;
  return new Date(now - actualDaysAgo * 24 * 60 * 60 * 1000);
}

/**
 * Generate Shopify order
 */
async function generateShopifyOrder(
  brandId: string,
  profileId: string,
  identifiers: any,
  products: any[],
  orderDate: Date,
  orderNumber: number
): Promise<void> {
  // Select order scenario
  const rand = Math.random();
  let cumulative = 0;
  let scenario = ORDER_SCENARIOS[0];
  for (const s of ORDER_SCENARIOS) {
    cumulative += s.weight;
    if (rand <= cumulative && s.channel === 'shopify') {
      scenario = s;
      break;
    }
  }

  const itemCount = scenario.itemCount();
  const selectedProducts = [];
  for (let i = 0; i < itemCount; i++) {
    selectedProducts.push(products[Math.floor(Math.random() * products.length)]);
  }

  const subtotal = selectedProducts.reduce((sum, p) => sum + (Number(p.price) || 0), 0);
  const tax = subtotal * 0.08; // 8% tax
  const shipping = subtotal > 100 ? 0 : 5.99; // Free shipping over $100
  const total = subtotal + tax + shipping;
  const multiplier = scenario.multiplier || 1;
  const finalTotal = total * multiplier;

  const orderStatus = ORDER_STATUSES[Math.floor(Math.random() * ORDER_STATUSES.length)];
  const paymentMethod = PAYMENT_METHODS[Math.floor(Math.random() * PAYMENT_METHODS.length)];

  // Create Shopify order event
  await ingestEvent({
    brandId,
    eventType: 'purchase',
    payload: {
      // Shopify order structure
      id: orderNumber,
      order_number: `ORD-${orderNumber}`,
      email: identifiers.email,
      phone: identifiers.phone,
      contact_email: identifiers.email,
      total_spent: finalTotal.toFixed(2),
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      shipping: shipping.toFixed(2),
      currency: 'USD',
      financial_status: orderStatus === 'delivered' ? 'paid' : orderStatus,
      fulfillment_status: orderStatus,
      payment_method: paymentMethod,
      created_at: orderDate.toISOString(),
      updated_at: orderDate.toISOString(),
      line_items: selectedProducts.map((p, idx) => ({
        id: `item-${orderNumber}-${idx}`,
        product_id: p.productId,
        product_name: p.name,
        variant_id: `variant-${p.productId}`,
        variant_title: 'Default',
        quantity: 1 + Math.floor(Math.random() * 2),
        price: (Number(p.price) * multiplier).toFixed(2),
        category: p.category || 'General',
        sku: `SKU-${p.productId}`,
      })),
      shipping_address: {
        first_name: 'John',
        last_name: 'Doe',
        address1: `${Math.floor(Math.random() * 9999)} Main St`,
        city: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'][Math.floor(Math.random() * 5)],
        province: 'NY',
        country: 'United States',
        zip: String(10000 + Math.floor(Math.random() * 90000)),
      },
      billing_address: {
        first_name: 'John',
        last_name: 'Doe',
        address1: `${Math.floor(Math.random() * 9999)} Main St`,
        city: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'][Math.floor(Math.random() * 5)],
        province: 'NY',
        country: 'United States',
        zip: String(10000 + Math.floor(Math.random() * 90000)),
      },
      source: 'shopify',
      source_name: 'web',
    },
  });
}

/**
 * Generate POS transaction
 */
async function generatePOSTransaction(
  brandId: string,
  profileId: string,
  identifiers: any,
  products: any[],
  transactionDate: Date,
  transactionNumber: number
): Promise<void> {
  const store = STORES[Math.floor(Math.random() * STORES.length)];
  const itemCount = 1 + Math.floor(Math.random() * 3);
  const selectedProducts = [];
  for (let i = 0; i < itemCount; i++) {
    selectedProducts.push(products[Math.floor(Math.random() * products.length)]);
  }

  const subtotal = selectedProducts.reduce((sum, p) => sum + (Number(p.price) || 0), 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;
  const paymentMethod = ['cash', 'credit_card', 'debit_card'][Math.floor(Math.random() * 3)];

  // Create POS transaction event
  await processPOSEvent(brandId, {
    transaction_id: `TXN-${transactionNumber}`,
    transaction_type: 'sale',
    store_id: store.id,
    store_name: store.name,
    location_id: store.id,
    customer: {
      phone: identifiers.phone,
      email: identifiers.email,
      loyalty_id: identifiers.loyalty_id,
    },
    phone: identifiers.phone,
    email: identifiers.email,
    loyalty_id: identifiers.loyalty_id,
    total: total,
    subtotal: subtotal,
    tax: tax,
    payment_method: paymentMethod,
    items: selectedProducts.map((p, idx) => ({
      product_id: p.productId,
      product_name: p.name,
      category: p.category || 'General',
      price: Number(p.price).toFixed(2),
      quantity: 1,
      sku: `SKU-${p.productId}`,
    })),
    timestamp: transactionDate.toISOString(),
    pos_system: 'square',
    receipt_number: `RCP-${transactionNumber}`,
  });
}

/**
 * Generate orders and transactions
 */
async function generateOrdersAndTransactions(brandId: string): Promise<void> {
  console.log(`\n📦 Generating ${ORDER_COUNT} orders and transactions...`);
  
  // Get existing profiles and products
  const [profiles, products] = await Promise.all([
    prisma.customerProfile.findMany({
      where: { brandId },
      take: 200, // Use first 200 profiles
    }),
    prisma.product.findMany({
      where: { brandId },
    }),
  ]);

  if (profiles.length === 0) {
    console.log('⚠️  No profiles found. Please run generateMockData first.');
    return;
  }

  if (products.length === 0) {
    console.log('⚠️  No products found. Please run generateMockData first.');
    return;
  }

  console.log(`   Using ${profiles.length} profiles and ${products.length} products`);

  let ordersGenerated = 0;
  let shopifyOrders = 0;
  let posTransactions = 0;

  // Distribute orders across profiles (some customers have multiple orders)
  const ordersPerProfile = Math.ceil(ORDER_COUNT / profiles.length);
  
  for (const profile of profiles) {
    const profileOrders = Math.min(ordersPerProfile, ORDER_COUNT - ordersGenerated);
    if (ordersGenerated >= ORDER_COUNT) break;

    const identifiers = profile.identifiers as any;
    if (!identifiers || Object.keys(identifiers).length === 0) {
      continue; // Skip profiles without identifiers
    }

    for (let i = 0; i < profileOrders && ordersGenerated < ORDER_COUNT; i++) {
      const orderDate = randomDateInPast(DAYS);
      const orderNumber = 100000 + ordersGenerated;
      
      // 70% Shopify, 30% POS
      const isPOS = Math.random() < 0.3;
      
      try {
        if (isPOS) {
          await generatePOSTransaction(brandId, profile.id, identifiers, products, orderDate, orderNumber);
          posTransactions++;
        } else {
          await generateShopifyOrder(brandId, profile.id, identifiers, products, orderDate, orderNumber);
          shopifyOrders++;
        }
        ordersGenerated++;
        
        if (ordersGenerated % 50 === 0) {
          console.log(`   ✅ Generated ${ordersGenerated}/${ORDER_COUNT} orders...`);
        }
      } catch (error) {
        // Continue on error
      }
    }
  }

  console.log(`   ✅ Generated ${ordersGenerated} orders:`);
  console.log(`      - Shopify Orders: ${shopifyOrders}`);
  console.log(`      - POS Transactions: ${posTransactions}`);
}

/**
 * Update profile statistics from orders
 */
async function updateAllProfileStatistics(brandId: string): Promise<void> {
  console.log(`\n📊 Updating profile statistics from orders...`);
  
  const { updateAllProfileStatistics } = await import('../services/profile/profileStatisticsService');
  const result = await updateAllProfileStatistics(brandId);

  console.log(`   ✅ Updated ${result.updated} profiles`);
  console.log(`   📊 Total LTV: $${result.totalLTV.toFixed(2)}`);
  console.log(`   📦 Total Orders: ${result.totalOrders}`);
}

/**
 * Main function
 */
async function main() {
  // Resolve test brand ID if needed
  const actualBrandId = await getTestBrandId();
  BRAND_ID = actualBrandId;

  console.log('🚀 Orders and Transactions Data Generator\n');
  console.log(`Configuration:`);
  console.log(`  Brand ID: ${BRAND_ID}`);
  console.log(`  Orders: ${ORDER_COUNT}`);
  console.log(`  Days: ${DAYS}\n`);

  try {
    await generateOrdersAndTransactions(BRAND_ID);
    await updateAllProfileStatistics(BRAND_ID);

    console.log('\n✅ Orders and transactions generation complete!');
    console.log(`\n📊 Summary:`);
    console.log(`  - Total Orders/Transactions: ${ORDER_COUNT}`);
    console.log(`  - Spread over: ${DAYS} days`);
    console.log(`  - Profile statistics updated`);
    
  } catch (error) {
    console.error('❌ Error generating orders:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

const STORES = [
  { id: 'STORE-001', name: 'Downtown Location', city: 'New York' },
  { id: 'STORE-002', name: 'Mall Location', city: 'Los Angeles' },
  { id: 'STORE-003', name: 'Outlet Location', city: 'Chicago' },
  { id: 'STORE-004', name: 'Flagship Store', city: 'Miami' },
  { id: 'STORE-005', name: 'Airport Location', city: 'San Francisco' }
];

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

