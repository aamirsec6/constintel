// GENERATOR: INTEGRATIONS
// ASSUMPTIONS: CRM API credentials in env, generic CRM connector
// HOW TO RUN: Use via /api/integrations/crm/* routes
// Supports: Salesforce, HubSpot, generic REST APIs

import { ingestEvent } from '../ingestion/eventIngestion';
import axios, { AxiosInstance } from 'axios';

export interface CRMConfig {
  type: 'salesforce' | 'hubspot' | 'generic';
  apiUrl?: string;
  accessToken?: string;
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  [key: string]: any;
}

export interface CRMContact {
  id: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  [key: string]: any;
}

export interface CRMEvent {
  contactId: string;
  eventType: string;
  timestamp?: string;
  properties?: Record<string, any>;
}

/**
 * Create CRM API client based on type
 */
export function createCRMClient(config: CRMConfig): AxiosInstance {
  const baseURL = config.apiUrl || getDefaultAPIUrl(config.type);
  
  const client = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
      ...(config.accessToken && { 'Authorization': `Bearer ${config.accessToken}` }),
      ...(config.apiKey && { 'X-API-Key': config.apiKey }),
    },
  });

  return client;
}

function getDefaultAPIUrl(type: string): string {
  const urls: Record<string, string> = {
    salesforce: 'https://your-instance.salesforce.com/services/data/v57.0',
    hubspot: 'https://api.hubapi.com',
    generic: '',
  };
  return urls[type] || '';
}

/**
 * Fetch contacts from Salesforce
 */
export async function fetchSalesforceContacts(
  client: AxiosInstance,
  limit: number = 100
): Promise<CRMContact[]> {
  try {
    const response = await client.get('/sobjects/Contact', {
      params: {
        limit,
      },
    });

    return response.data.records.map((record: any) => ({
      id: record.Id,
      email: record.Email,
      phone: record.Phone,
      firstName: record.FirstName,
      lastName: record.LastName,
      company: record.Account?.Name,
      salesforce_data: record,
    }));
  } catch (error) {
    console.error('Error fetching Salesforce contacts:', error);
    throw error;
  }
}

/**
 * Fetch contacts from HubSpot
 */
export async function fetchHubSpotContacts(
  client: AxiosInstance,
  limit: number = 100
): Promise<CRMContact[]> {
  try {
    const response = await client.get('/crm/v3/objects/contacts', {
      params: {
        limit,
        properties: 'email,phone,firstname,lastname,company',
      },
    });

    return response.data.results.map((contact: any) => ({
      id: contact.id,
      email: contact.properties?.email,
      phone: contact.properties?.phone,
      firstName: contact.properties?.firstname,
      lastName: contact.properties?.lastname,
      company: contact.properties?.company,
      hubspot_data: contact,
    }));
  } catch (error) {
    console.error('Error fetching HubSpot contacts:', error);
    throw error;
  }
}

/**
 * Fetch contacts from generic REST API
 */
export async function fetchGenericContacts(
  client: AxiosInstance,
  endpoint: string = '/contacts',
  limit: number = 100
): Promise<CRMContact[]> {
  try {
    const response = await client.get(endpoint, {
      params: { limit },
    });

    // Try to normalize the response
    const contacts = Array.isArray(response.data) 
      ? response.data 
      : response.data.results || response.data.contacts || [];

    return contacts.map((contact: any) => ({
      id: contact.id || contact.contact_id,
      email: contact.email,
      phone: contact.phone || contact.phone_number,
      firstName: contact.firstName || contact.first_name,
      lastName: contact.lastName || contact.last_name,
      company: contact.company || contact.company_name,
      raw_data: contact,
    }));
  } catch (error) {
    console.error('Error fetching generic contacts:', error);
    throw error;
  }
}

/**
 * Sync CRM contacts to our platform
 */
export async function syncCRMContacts(
  brandId: string,
  config: CRMConfig,
  contacts: CRMContact[]
): Promise<{
  success: boolean;
  processed: number;
  errors: Array<{ contactId: string; error: string }>;
}> {
  const errors: Array<{ contactId: string; error: string }> = [];
  let processed = 0;

  for (const contact of contacts) {
    try {
      await ingestEvent({
        brandId,
        eventType: 'crm_contact_sync',
        payload: {
          crm_type: config.type,
          crm_contact_id: contact.id,
          email: contact.email,
          phone: contact.phone,
          first_name: contact.firstName,
          last_name: contact.lastName,
          company: contact.company,
          source: `crm_${config.type}`,
        },
      });
      processed++;
    } catch (error) {
      errors.push({
        contactId: contact.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return {
    success: errors.length === 0,
    processed,
    errors,
  };
}

/**
 * Process CRM webhook event
 */
export async function processCRMWebhook(
  brandId: string,
  crmType: string,
  payload: any
): Promise<{ success: boolean; eventId?: string; profileId?: string }> {
  try {
    // Extract contact information from webhook payload
    const contactData: any = {
      crm_type: crmType,
      source: `crm_${crmType}_webhook`,
      ...payload,
    };

    // Determine event type
    let eventType = 'crm_webhook';
    if (payload.eventType) {
      eventType = `crm_${payload.eventType}`;
    } else if (payload.type) {
      eventType = `crm_${payload.type}`;
    }

    const result = await ingestEvent({
      brandId,
      eventType,
      payload: contactData,
    });

    return {
      success: true,
      eventId: result.eventId,
      profileId: result.profileId || undefined,
    };
  } catch (error) {
    console.error('Error processing CRM webhook:', error);
    throw error;
  }
}

