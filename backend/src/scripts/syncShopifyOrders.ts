// Sync existing orders from Shopify to ConstIntel
// Run: npx tsx src/scripts/syncShopifyOrders.ts

import { getPrismaClient } from '../db/prismaClient';
import { processShopifyWebhook } from '../services/integrations/shopify';

const prisma = getPrismaClient();
const BRAND_ID = 'rhino-9918';

/**
 * Fetch orders from Shopify Admin API
 * You'll need to set up a Shopify app or use API credentials
 */
async function fetchShopifyOrders(limit: number = 250) {
  // TODO: Replace with actual Shopify API call
  // You'll need:
  // 1. SHOPIFY_STORE_DOMAIN (e.g., 'your-store.myshopify.com')
  // 2. SHOPIFY_ACCESS_TOKEN (from Shopify app)
  
  console.log('⚠️  This script needs Shopify API credentials');
  console.log('');
  console.log('Option 1: Use Shopify Admin API');
  console.log('  - Create a Shopify app');
  console.log('  - Get access token');
  console.log('  - Call: GET https://{store}.myshopify.com/admin/api/2024-01/orders.json');
  console.log('');
  console.log('Option 2: Export from Shopify Admin');
  console.log('  - Go to Orders → Export');
  console.log('  - Download CSV');
  console.log('  - Use CSV import feature');
  console.log('');
  console.log('Option 3: Manual sync via webhook replay');
  console.log('  - Shopify can resend webhooks for recent orders');
  console.log('  - Go to webhook settings → Resend webhooks');
  console.log('');
  
  return [];
}

/**
 * Sync a single order
 */
async function syncOrder(order: any) {
  try {
    // Transform order to webhook format
    const webhookPayload = {
      id: order.id,
      email: order.email,
      phone: order.phone,
      first_name: order.customer?.first_name || order.billing_address?.first_name,
      last_name: order.customer?.last_name || order.billing_address?.last_name,
      total_spent: order.total_price,
      orders_count: 1,
      line_items: order.line_items || [],
      created_at: order.created_at,
      updated_at: order.updated_at,
      financial_status: order.financial_status,
      fulfillment_status: order.fulfillment_status,
      ...order,
    };

    // Process as webhook
    const result = await processShopifyWebhook(
      BRAND_ID,
      'orders/create',
      webhookPayload
    );

    return result;
  } catch (error) {
    console.error('Error syncing order:', error);
    throw error;
  }
}

/**
 * Main sync function
 */
async function syncShopifyOrders() {
  console.log('🔄 Syncing existing orders from Shopify...');
  console.log('Brand ID:', BRAND_ID);
  console.log('');

  try {
    // Check if we have API credentials
    const hasCredentials = process.env.SHOPIFY_STORE_DOMAIN && 
                           process.env.SHOPIFY_ACCESS_TOKEN;

    if (!hasCredentials) {
      console.log('📋 Manual Sync Instructions:');
      console.log('');
      console.log('METHOD 1: Export from Shopify (Easiest)');
      console.log('  1. Go to: https://admin.shopify.com/store/rhino-9918/orders');
      console.log('  2. Click "Export" button');
      console.log('  3. Select "All orders" or date range');
      console.log('  4. Download CSV');
      console.log('  5. Use CSV upload feature in dashboard');
      console.log('');
      console.log('METHOD 2: Resend Webhooks (Quick)');
      console.log('  1. Go to: https://admin.shopify.com/store/rhino-9918/settings/notifications');
      console.log('  2. Find your webhook');
      console.log('  3. Click "..." → "Resend webhooks"');
      console.log('  4. Select date range (last 30 days)');
      console.log('  5. This will resend webhooks for existing orders');
      console.log('');
      console.log('METHOD 3: Shopify API (Advanced)');
      console.log('  1. Create Shopify app');
      console.log('  2. Get access token');
      console.log('  3. Add to .env:');
      console.log('     SHOPIFY_STORE_DOMAIN=your-store.myshopify.com');
      console.log('     SHOPIFY_ACCESS_TOKEN=your_token');
      console.log('  4. Run this script again');
      console.log('');
      
      // Check if we can resend webhooks
      console.log('💡 RECOMMENDED: Use METHOD 2 (Resend Webhooks)');
      console.log('   This is the fastest way to sync existing orders!');
      
      return;
    }

    // Fetch orders from API
    const orders = await fetchShopifyOrders();
    
    if (orders.length === 0) {
      console.log('No orders found or API not configured');
      return;
    }

    console.log(`Found ${orders.length} orders to sync`);
    console.log('');

    let success = 0;
    let errors = 0;

    for (const order of orders) {
      try {
        await syncOrder(order);
        success++;
        if (success % 10 === 0) {
          console.log(`Processed ${success} orders...`);
        }
      } catch (error) {
        errors++;
        console.error(`Error syncing order ${order.id}:`, error);
      }
    }

    console.log('');
    console.log('✅ Sync complete!');
    console.log(`   Success: ${success}`);
    console.log(`   Errors: ${errors}`);
    console.log('');
    console.log('Check dashboard: http://localhost:3001/profiles');
  } catch (error) {
    console.error('Fatal error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  syncShopifyOrders()
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

