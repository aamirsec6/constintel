// Sync products from Shopify to ConstIntel
// Run: npx tsx src/scripts/syncShopifyProducts.ts

import { getPrismaClient } from '../db/prismaClient';

const prisma = getPrismaClient();
const BRAND_ID = 'rhino-9918';

// This is a placeholder - you'll need Shopify API credentials
// For now, this shows the structure

async function syncShopifyProducts() {
  console.log('🔄 Syncing products from Shopify...');
  console.log('Brand ID:', BRAND_ID);
  console.log('');

  // TODO: Replace with actual Shopify API call
  // You'll need:
  // 1. SHOPIFY_API_KEY in .env
  // 2. SHOPIFY_API_SECRET in .env
  // 3. SHOPIFY_STORE_DOMAIN in .env (e.g., 'your-store.myshopify.com')
  
  console.log('⚠️  This script needs Shopify API credentials');
  console.log('');
  console.log('To get real product data:');
  console.log('1. Install Shopify app or use API');
  console.log('2. Or manually add products via dashboard');
  console.log('3. Or use webhook: products/create');
  console.log('');
  console.log('For now, products will be created automatically when:');
  console.log('- Customers view products (from tracking script)');
  console.log('- Orders come through webhooks');
  console.log('');

  // Example: Create a product from tracking data
  const recentEvents = await prisma.customerRawEvent.findMany({
    where: {
      brandId: BRAND_ID,
      eventType: { in: ['product_view', 'cart_add'] },
      payload: {
        path: ['product_id'],
        not: null,
      },
    },
    take: 20,
  });

  console.log(`Found ${recentEvents.length} events with product data`);
  
  const productIds = new Set<string>();
  for (const event of recentEvents) {
    const payload = event.payload as any;
    if (payload?.product_id) {
      productIds.add(payload.product_id);
    }
  }

  console.log(`Found ${productIds.size} unique products`);
  console.log('');

  // Create products from event data
  let created = 0;
  for (const productId of productIds) {
    const event = recentEvents.find(e => (e.payload as any)?.product_id === productId);
    if (!event) continue;

    const payload = event.payload as any;
    
    try {
      // Check if product exists
      const existing = await prisma.product.findFirst({
        where: {
          productId: productId,
          brandId: BRAND_ID,
        },
      });

      if (existing && existing.brandId === BRAND_ID) {
        // Update existing
        await prisma.product.update({
          where: { id: existing.id },
          data: {
            name: payload.product_name || existing.name,
            category: payload.category || existing.category,
            price: payload.product_price ? parseFloat(payload.product_price) : existing.price,
          },
        });
        created++;
      } else if (!existing) {
        // Create new
        await prisma.product.create({
          data: {
            brandId: BRAND_ID,
            productId: productId,
            name: payload.product_name || `Product ${productId}`,
            category: payload.category || 'Uncategorized',
            description: payload.product_description || null,
            sku: payload.sku || null,
            price: payload.product_price ? parseFloat(payload.product_price) : null,
            currency: 'USD',
            metadata: {
              source: 'shopify_tracking',
              firstSeen: new Date().toISOString(),
            },
          },
        });
      }
      created++;
    } catch (error) {
      console.error(`Error creating product ${productId}:`, error);
    }
  }

  console.log(`✅ Created/updated ${created} products`);
  console.log('');
  console.log('View products: http://localhost:3001/inventory/dashboard');
  
  await prisma.$disconnect();
}

if (require.main === module) {
  syncShopifyProducts()
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

