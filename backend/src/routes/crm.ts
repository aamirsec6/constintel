// GENERATOR: INTEGRATIONS
// ASSUMPTIONS: Express app, CRM integration services available
// HOW TO RUN: app.use('/api/integrations/crm', crmRouter)

import { Router, Request, Response } from 'express';
import {
  createCRMClient,
  fetchSalesforceContacts,
  fetchHubSpotContacts,
  fetchGenericContacts,
  syncCRMContacts,
  processCRMWebhook,
  CRMConfig,
} from '../services/integrations/crm';

const router = Router();

/**
 * POST /api/integrations/crm/sync
 * Sync contacts from CRM
 */
router.post('/sync', async (req: Request, res: Response) => {
  try {
    const brandId = (req.headers['x-brand-id'] || req.body.brand_id) as string;
    const { type, config, limit = 100 } = req.body;

    if (!brandId) {
      return res.status(400).json({ error: 'x-brand-id header required' });
    }

    if (!type || !['salesforce', 'hubspot', 'generic'].includes(type)) {
      return res.status(400).json({ error: 'Invalid CRM type. Must be salesforce, hubspot, or generic' });
    }

    const crmConfig: CRMConfig = {
      type,
      ...config,
    };

    const client = createCRMClient(crmConfig);

    // Fetch contacts based on CRM type
    let contacts;
    if (type === 'salesforce') {
      contacts = await fetchSalesforceContacts(client, limit);
    } else if (type === 'hubspot') {
      contacts = await fetchHubSpotContacts(client, limit);
    } else {
      contacts = await fetchGenericContacts(client, config?.endpoint || '/contacts', limit);
    }

    // Sync contacts to platform
    const result = await syncCRMContacts(brandId, crmConfig, contacts);

    res.status(200).json({
      success: result.success,
      data: {
        processed: result.processed,
        total: contacts.length,
        errors: result.errors,
      },
    });
  } catch (error) {
    console.error('CRM sync error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * POST /api/integrations/crm/webhook
 * Handle CRM webhook events
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const brandId = (req.headers['x-brand-id'] || req.body.brand_id) as string;
    const crmType = (req.headers['x-crm-type'] || req.body.crm_type) as string;

    if (!brandId) {
      return res.status(400).json({ error: 'x-brand-id header required' });
    }

    if (!crmType) {
      return res.status(400).json({ error: 'x-crm-type header or crm_type in body required' });
    }

    const result = await processCRMWebhook(brandId, crmType, req.body);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('CRM webhook error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * GET /api/integrations/crm/test
 * Test CRM connection
 */
router.post('/test', async (req: Request, res: Response) => {
  try {
    const { type, config } = req.body;

    if (!type || !['salesforce', 'hubspot', 'generic'].includes(type)) {
      return res.status(400).json({ error: 'Invalid CRM type' });
    }

    const crmConfig: CRMConfig = {
      type,
      ...config,
    };

    const client = createCRMClient(crmConfig);

    // Test connection
    let testResult;
    if (type === 'salesforce') {
      // Test Salesforce connection
      await client.get('/sobjects');
      testResult = { connected: true, message: 'Salesforce connection successful' };
    } else if (type === 'hubspot') {
      // Test HubSpot connection
      await client.get('/crm/v3/objects/contacts', { params: { limit: 1 } });
      testResult = { connected: true, message: 'HubSpot connection successful' };
    } else {
      // Test generic connection
      await client.get(config?.endpoint || '/');
      testResult = { connected: true, message: 'Generic CRM connection successful' };
    }

    res.status(200).json({
      success: true,
      data: testResult,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Connection failed',
    });
  }
});

export default router;

