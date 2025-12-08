// GENERATOR: SANDBOX
// ASSUMPTIONS: Backend server running on localhost:3000, TEST_BRAND_ID in env
// HOW TO RUN: npm run verify:integrations or tsx src/scripts/verifyIntegrations.ts

import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:3000';
const BRAND_ID = process.env.TEST_BRAND_ID || 'test-brand';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testHealthCheck() {
  log('\n📡 Testing Health Check...', 'blue');
  try {
    const response = await axios.get(`${API_URL}/health`);
    if (response.data.status === 'healthy') {
      log('  ✅ Health check passed', 'green');
      return true;
    } else {
      log('  ❌ Health check failed: unhealthy status', 'red');
      return false;
    }
  } catch (error) {
    log(`  ❌ Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'red');
    return false;
  }
}

async function testPOSIntegration() {
  log('\n🏪 Testing POS Integration...', 'blue');
  try {
    const payload = {
      transaction_id: `TXN${Date.now()}`,
      store_id: 'STORE001',
      customer: {
        phone: '1234567890',
        email: 'pos-test@example.com',
        loyalty_id: 'LOY_TEST',
      },
      items: [
        {
          product_id: 'PROD123',
          name: 'Test Product',
          quantity: 2,
          price: 29.99,
          category: 'Electronics',
        },
      ],
      total: 59.98,
      payment_method: 'card',
      timestamp: new Date().toISOString(),
    };

    const response = await axios.post(
      `${API_URL}/api/integrations/pos/event`,
      payload,
      {
        headers: {
          'x-brand-id': BRAND_ID,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.success) {
      log('  ✅ POS integration test passed', 'green');
      log(`  Event ID: ${response.data.data.eventId}`, 'yellow');
      return true;
    } else {
      log('  ❌ POS integration test failed', 'red');
      return false;
    }
  } catch (error) {
    log(`  ❌ POS integration test failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'red');
    return false;
  }
}

async function testShopifyWebhook() {
  log('\n🛍️  Testing Shopify Webhook...', 'blue');
  try {
    const payload = {
      id: 12345,
      email: 'shopify-test@example.com',
      phone: '9876543210',
      first_name: 'Shopify',
      last_name: 'Test',
      total_spent: '199.99',
      orders_count: 5,
    };

    const response = await axios.post(
      `${API_URL}/api/integrations/shopify/webhook`,
      payload,
      {
        headers: {
          'x-brand-id': BRAND_ID,
          'x-shopify-topic': 'orders/create',
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.success) {
      log('  ✅ Shopify webhook test passed', 'green');
      log(`  Event ID: ${response.data.data.eventId}`, 'yellow');
      return true;
    } else {
      log('  ❌ Shopify webhook test failed', 'red');
      return false;
    }
  } catch (error) {
    log(`  ❌ Shopify webhook test failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'red');
    return false;
  }
}

async function testWooCommerceWebhook() {
  log('\n🛒 Testing WooCommerce Webhook...', 'blue');
  try {
    const payload = {
      id: 67890,
      billing: {
        email: 'woocommerce-test@example.com',
        phone: '5551234567',
        first_name: 'WooCommerce',
        last_name: 'Test',
      },
      total: '149.99',
      status: 'completed',
      line_items: [
        {
          product_id: 123,
          name: 'Test Product',
          quantity: 1,
          total: '149.99',
        },
      ],
    };

    const response = await axios.post(
      `${API_URL}/api/integrations/woocommerce/webhook`,
      payload,
      {
        headers: {
          'x-brand-id': BRAND_ID,
          'x-wc-webhook-topic': 'order.created',
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.success) {
      log('  ✅ WooCommerce webhook test passed', 'green');
      log(`  Event ID: ${response.data.data.eventId}`, 'yellow');
      return true;
    } else {
      log('  ❌ WooCommerce webhook test failed', 'red');
      return false;
    }
  } catch (error) {
    log(`  ❌ WooCommerce webhook test failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'red');
    return false;
  }
}

async function testCSVUpload() {
  log('\n📄 Testing CSV Upload...', 'blue');
  try {
    const FormData = require('form-data');
    const fs = require('fs');
    const path = require('path');

    const csvPath = path.join(__dirname, 'sample.csv');
    if (!fs.existsSync(csvPath)) {
      log('  ⚠️  Sample CSV file not found, skipping test', 'yellow');
      return true;
    }

    const form = new FormData();
    form.append('file', fs.createReadStream(csvPath));
    form.append('default_event_type', 'purchase');

    const response = await axios.post(
      `${API_URL}/api/integrations/csv/upload`,
      form,
      {
        headers: {
          'x-brand-id': BRAND_ID,
          ...form.getHeaders(),
        },
      }
    );

    if (response.data.success) {
      log('  ✅ CSV upload test passed', 'green');
      log(`  Processed: ${response.data.data.processed} rows`, 'yellow');
      return true;
    } else {
      log('  ❌ CSV upload test failed', 'red');
      return false;
    }
  } catch (error) {
    log(`  ❌ CSV upload test failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'red');
    return false;
  }
}

async function testEventIngestion() {
  log('\n📥 Testing Event Ingestion...', 'blue');
  try {
    const payload = {
      event_type: 'purchase',
      payload: {
        phone: '1112223333',
        email: 'ingestion-test@example.com',
        total: 99.99,
        items: [
          {
            product_id: 'PROD999',
            name: 'Test Item',
            quantity: 1,
            price: 99.99,
          },
        ],
      },
    };

    const response = await axios.post(
      `${API_URL}/api/events`,
      payload,
      {
        headers: {
          'x-brand-id': BRAND_ID,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.success) {
      log('  ✅ Event ingestion test passed', 'green');
      log(`  Event ID: ${response.data.data.eventId}`, 'yellow');
      return true;
    } else {
      log('  ❌ Event ingestion test failed', 'red');
      return false;
    }
  } catch (error) {
    log(`  ❌ Event ingestion test failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'red');
    return false;
  }
}

async function testProfilesAPI() {
  log('\n👥 Testing Profiles API...', 'blue');
  try {
    const response = await axios.get(`${API_URL}/api/profiles`, {
      headers: {
        'x-brand-id': BRAND_ID,
      },
    });

    if (response.data.success) {
      log('  ✅ Profiles API test passed', 'green');
      log(`  Total Profiles: ${response.data.pagination?.total || response.data.data?.length || 0}`, 'yellow');
      return true;
    } else {
      log('  ❌ Profiles API test failed', 'red');
      return false;
    }
  } catch (error) {
    log(`  ❌ Profiles API test failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'red');
    return false;
  }
}

async function main() {
  log('🧪 Starting Integration Verification Tests...', 'blue');
  log(`API URL: ${API_URL}`, 'yellow');
  log(`Brand ID: ${BRAND_ID}`, 'yellow');

  const results = {
    health: await testHealthCheck(),
    pos: await testPOSIntegration(),
    shopify: await testShopifyWebhook(),
    woocommerce: await testWooCommerceWebhook(),
    csv: await testCSVUpload(),
    ingestion: await testEventIngestion(),
    profiles: await testProfilesAPI(),
  };

  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;

  log('\n📊 Test Results:', 'blue');
  log(`  Passed: ${passed}/${total}`, passed === total ? 'green' : 'yellow');

  if (passed === total) {
    log('\n✅ All tests passed!', 'green');
    process.exit(0);
  } else {
    log('\n❌ Some tests failed', 'red');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

