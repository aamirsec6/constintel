// GENERATOR: INTEGRATIONS
// ASSUMPTIONS: Express app, multer for file uploads, integration services available
// HOW TO RUN: app.use('/api/integrations', integrationsRouter)

import { Router, Request, Response } from 'express';
import multer from 'multer';
import {
  verifyShopifyWebhook,
  processShopifyWebhook,
} from '../services/integrations/shopify';
import {
  verifyWooCommerceWebhook,
  processWooCommerceWebhook,
} from '../services/integrations/woocommerce';
import {
  verifyTwilioWebhook,
  processTwilioWebhook,
  sendWhatsAppMessage,
} from '../services/integrations/twilio';
import { processPOSEvent } from '../services/integrations/pos';
import { processCSVImport } from '../services/integrations/csv';

const router = Router();

// Configure multer for file uploads (CSV)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

/**
 * POST /api/integrations/shopify/webhook
 * Shopify webhook endpoint
 */
router.post('/shopify/webhook', async (req: Request, res: Response) => {
  try {
    // Get brand ID from header, query param, or default to rhino-9918
    const brandId = (req.headers['x-brand-id'] || 
                     req.query.brand_id || 
                     req.body.brand_id || 
                     'rhino-9918') as string;
    
    // Get topic from header (Shopify sends this)
    const topic = (req.headers['x-shopify-topic'] || 
                   req.headers['x-shopify-shop-domain'] ? 'orders/create' : null) as string;
    
    const signature = req.headers['x-shopify-hmac-sha256'] as string;
    const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET;

    // Log incoming webhook for debugging
    console.log(`[Shopify Webhook] Topic: ${topic}, Brand: ${brandId}, Has signature: ${!!signature}`);

    if (!topic) {
      // Try to infer from payload
      if (req.body.id && req.body.email) {
        // Likely an order
        const inferredTopic = req.body.financial_status ? 'orders/create' : 'customers/create';
        console.log(`[Shopify Webhook] Inferred topic: ${inferredTopic}`);
        // Use inferred topic
        const result = await processShopifyWebhook(brandId, inferredTopic, req.body);
        return res.status(200).json({ success: true, data: result });
      }
      return res.status(400).json({ error: 'x-shopify-topic header required or payload must contain order/customer data' });
    }

    // Verify webhook signature if secret is configured
    if (webhookSecret) {
      const body = JSON.stringify(req.body);
      const isValid = verifyShopifyWebhook(body, signature, webhookSecret);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }
    }

    const result = await processShopifyWebhook(brandId, topic, req.body);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Shopify webhook error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * POST /api/integrations/woocommerce/webhook
 * WooCommerce webhook endpoint
 */
router.post('/woocommerce/webhook', async (req: Request, res: Response) => {
  try {
    const brandId = (req.headers['x-brand-id'] || req.body.brand_id) as string;
    const topic = (req.headers['x-wc-webhook-topic'] || req.body.topic) as string;
    const signature = req.headers['x-wc-webhook-signature'] as string;
    const webhookSecret = process.env.WOOCOMMERCE_WEBHOOK_SECRET;

    if (!brandId) {
      return res.status(400).json({ error: 'x-brand-id header required' });
    }

    if (!topic) {
      return res.status(400).json({ error: 'x-wc-webhook-topic header required' });
    }

    // Verify webhook signature if secret is configured
    if (webhookSecret) {
      const body = JSON.stringify(req.body);
      const isValid = verifyWooCommerceWebhook(body, signature, webhookSecret);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }
    }

    const result = await processWooCommerceWebhook(brandId, topic, req.body);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('WooCommerce webhook error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * POST /api/integrations/twilio/webhook
 * Twilio WhatsApp webhook endpoint
 */
router.post('/twilio/webhook', async (req: Request, res: Response) => {
  try {
    const brandId = (req.headers['x-brand-id'] || req.body.brand_id) as string;
    const signature = req.headers['x-twilio-signature'] as string;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!brandId) {
      return res.status(400).json({ error: 'x-brand-id header required' });
    }

    // Verify webhook signature if auth token is configured
    if (authToken) {
      const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
      const params = req.body as Record<string, string>;
      const isValid = verifyTwilioWebhook(url, params, signature, authToken);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }
    }

    const result = await processTwilioWebhook(brandId, req.body);

    // Twilio expects TwiML response for some webhooks
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Twilio webhook error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * POST /api/integrations/twilio/send
 * Send WhatsApp message via Twilio
 */
router.post('/twilio/send', async (req: Request, res: Response) => {
  try {
    const { to, message, from } = req.body;

    if (!to || !message) {
      return res.status(400).json({ error: 'to and message are required' });
    }

    const result = await sendWhatsAppMessage(to, message, from);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Twilio send error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * POST /api/integrations/pos/event
 * Generic POS event endpoint
 */
router.post('/pos/event', async (req: Request, res: Response) => {
  try {
    const brandId = (req.headers['x-brand-id'] || req.body.brand_id) as string;

    if (!brandId) {
      return res.status(400).json({ error: 'x-brand-id header required' });
    }

    const result = await processPOSEvent(brandId, req.body);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('POS event error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * POST /api/integrations/csv/upload
 * CSV import endpoint
 */
router.post('/csv/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const brandId = (req.headers['x-brand-id'] || req.body.brand_id) as string;

    if (!brandId) {
      return res.status(400).json({ error: 'x-brand-id header required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'CSV file required' });
    }

    const options = {
      delimiter: req.body.delimiter || ',',
      columnMapping: req.body.column_mapping ? JSON.parse(req.body.column_mapping) : undefined,
      defaultEventType: req.body.default_event_type || 'csv_import',
    };

    const result = await processCSVImport(brandId, req.file.buffer, options);

    res.status(200).json({
      success: result.success,
      data: {
        processed: result.processed,
        total: result.processed + result.errors.length,
        errors: result.errors,
      },
    });
  } catch (error) {
    console.error('CSV upload error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

export default router;

