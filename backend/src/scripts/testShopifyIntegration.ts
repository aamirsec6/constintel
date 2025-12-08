// GENERATOR: OMNICHANNEL_PLATFORM
// ASSUMPTIONS: Backend server running, Shopify webhook endpoint available
// HOW TO RUN: tsx src/scripts/testShopifyIntegration.ts

import axios from 'axios';
import crypto from 'crypto';

const API_URL = process.env.API_URL || 'http://localhost:3000';
const BRAND_ID = process.env.TEST_BRAND_ID || 'test-brand';
const WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET || '';

/**
 * Generate Shopify webhook signature
 */
function generateShopifySignature(body: string, secret: string): string {
  if (!secret) {
    console.warn('⚠️  No SHOPIFY_WEBHOOK_SECRET provided, signature will be invalid');
    return '';
  }
  const hmac = crypto.createHmac('sha256', secret);
  return hmac.update(body, 'utf8').digest('base64');
}

/**
 * Test Shopify webhook with order creation event
 */
async function testOrderCreateWebhook() {
  console.log('\n📦 Testing Order Create Webhook...');
  
  const orderPayload = {
    id: 123456789,
    email: 'test-customer@example.com',
    phone: '+1234567890',
    first_name: 'John',
    last_name: 'Doe',
    total_spent: '299.99',
    orders_count: 1,
    created_at: new Date().toISOString(),
    line_items: [
      {
        product_id: 12345,
        title: 'Test Product',
        quantity: 2,
        price: '149.99',
      },
    ],
    total_price: '299.98',
    currency: 'USD',
  };

  const body = JSON.stringify(orderPayload);
  const signature = generateShopifySignature(body, WEBHOOK_SECRET);

  try {
    const response = await axios.post(
      `${API_URL}/api/integrations/shopify/webhook`,
      orderPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-brand-id': BRAND_ID,
          'x-shopify-topic': 'orders/create',
          'x-shopify-hmac-sha256': signature,
        },
      }
    );

    if (response.data.success) {
      console.log('✅ Order create webhook test passed');
      console.log(`   Event ID: ${response.data.data?.eventId || 'N/A'}`);
      console.log(`   Profile ID: ${response.data.data?.profileId || 'N/A'}`);
      return true;
    } else {
      console.error('❌ Order create webhook test failed:', response.data.error);
      return false;
    }
  } catch (error: any) {
    console.error('❌ Order create webhook test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Error:', error.response.data);
    }
    return false;
  }
}

/**
 * Test Shopify webhook with customer creation event
 */
async function testCustomerCreateWebhook() {
  console.log('\n👤 Testing Customer Create Webhook...');
  
  const customerPayload = {
    id: 987654321,
    email: 'new-customer@example.com',
    phone: '+1987654321',
    first_name: 'Jane',
    last_name: 'Smith',
    created_at: new Date().toISOString(),
    accepts_marketing: true,
  };

  const body = JSON.stringify(customerPayload);
  const signature = generateShopifySignature(body, WEBHOOK_SECRET);

  try {
    const response = await axios.post(
      `${API_URL}/api/integrations/shopify/webhook`,
      customerPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-brand-id': BRAND_ID,
          'x-shopify-topic': 'customers/create',
          'x-shopify-hmac-sha256': signature,
        },
      }
    );

    if (response.data.success) {
      console.log('✅ Customer create webhook test passed');
      console.log(`   Event ID: ${response.data.data?.eventId || 'N/A'}`);
      console.log(`   Profile ID: ${response.data.data?.profileId || 'N/A'}`);
      return true;
    } else {
      console.error('❌ Customer create webhook test failed:', response.data.error);
      return false;
    }
  } catch (error: any) {
    console.error('❌ Customer create webhook test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Error:', error.response.data);
    }
    return false;
  }
}

/**
 * Test frontend event tracking endpoint
 */
async function testFrontendEventTracking() {
  console.log('\n🎯 Testing Frontend Event Tracking...');
  
  const eventPayload = {
    brand_id: BRAND_ID,
    event_type: 'product_view',
    payload: {
      product_id: 'PROD123',
      product_name: 'Test Product',
      category: 'Electronics',
      price: '99.99',
      view_duration: 45,
      identifiers: {
        device_id: 'test-device-123',
        email: 'test-customer@example.com',
      },
      page_url: 'https://test-store.myshopify.com/products/test-product',
      source: 'shopify_web',
    },
  };

  try {
    const response = await axios.post(
      `${API_URL}/api/events`,
      eventPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-brand-id': BRAND_ID,
        },
      }
    );

    if (response.data.success) {
      console.log('✅ Frontend event tracking test passed');
      console.log(`   Event ID: ${response.data.data?.eventId || 'N/A'}`);
      console.log(`   Profile ID: ${response.data.data?.profileId || 'N/A'}`);
      return true;
    } else {
      console.error('❌ Frontend event tracking test failed:', response.data.error);
      return false;
    }
  } catch (error: any) {
    console.error('❌ Frontend event tracking test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Error:', error.response.data);
    }
    return false;
  }
}

/**
 * Test product intent tracking
 */
async function testProductIntentTracking() {
  console.log('\n🛍️  Testing Product Intent Tracking...');
  
  const intentPayload = {
    brand_id: BRAND_ID,
    profile_id: 'test-profile-id', // This would be from a real profile
    product_id: 'PROD123',
    product_name: 'Test Product',
    category: 'Electronics',
    intent_type: 'product_view',
    source_channel: 'shopify_web',
    view_duration: 120,
  };

  try {
    const response = await axios.post(
      `${API_URL}/api/intent/track`,
      intentPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-brand-id': BRAND_ID,
        },
      }
    );

    if (response.data.success) {
      console.log('✅ Product intent tracking test passed');
      console.log(`   Intent ID: ${response.data.data?.id || 'N/A'}`);
      console.log(`   Intent Score: ${response.data.data?.intentScore || 'N/A'}`);
      return true;
    } else {
      console.error('❌ Product intent tracking test failed:', response.data.error);
      return false;
    }
  } catch (error: any) {
    console.error('❌ Product intent tracking test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Error:', error.response.data);
    }
    return false;
  }
}

/**
 * Check API health
 */
async function checkAPIHealth() {
  console.log('\n🏥 Checking API Health...');
  
  try {
    const response = await axios.get(`${API_URL}/health`);
    if (response.data.status === 'healthy') {
      console.log('✅ API is healthy');
      console.log(`   Database: ${response.data.services?.database || 'unknown'}`);
      return true;
    } else {
      console.error('❌ API health check failed');
      return false;
    }
  } catch (error: any) {
    console.error('❌ API health check failed:', error.message);
    return false;
  }
}

/**
 * Main test function
 */
async function main() {
  console.log('🧪 Shopify Integration Test Suite');
  console.log('================================');
  console.log(`API URL: ${API_URL}`);
  console.log(`Brand ID: ${BRAND_ID}`);
  console.log(`Webhook Secret: ${WEBHOOK_SECRET ? '✅ Set' : '⚠️  Not set (signature verification will be skipped)'}`);
  console.log('');

  const results = {
    health: false,
    orderWebhook: false,
    customerWebhook: false,
    frontendTracking: false,
    productIntent: false,
  };

  // Check API health first
  results.health = await checkAPIHealth();
  
  if (!results.health) {
    console.error('\n❌ API is not healthy. Please start the backend server first.');
    process.exit(1);
  }

  // Run tests
  results.orderWebhook = await testOrderCreateWebhook();
  results.customerWebhook = await testCustomerCreateWebhook();
  results.frontendTracking = await testFrontendEventTracking();
  results.productIntent = await testProductIntentTracking();

  // Summary
  console.log('\n📊 Test Summary');
  console.log('================================');
  console.log(`API Health:        ${results.health ? '✅' : '❌'}`);
  console.log(`Order Webhook:     ${results.orderWebhook ? '✅' : '❌'}`);
  console.log(`Customer Webhook:  ${results.customerWebhook ? '✅' : '❌'}`);
  console.log(`Frontend Tracking: ${results.frontendTracking ? '✅' : '❌'}`);
  console.log(`Product Intent:    ${results.productIntent ? '✅' : '❌'}`);
  console.log('');

  const allPassed = Object.values(results).every(r => r);
  
  if (allPassed) {
    console.log('🎉 All tests passed! Your Shopify integration is ready.');
  } else {
    console.log('⚠️  Some tests failed. Please check the errors above.');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

