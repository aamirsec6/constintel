// GENERATOR: INTEGRATIONS
// ASSUMPTIONS: CSV file upload with customer/event data
// HOW TO RUN: Use via /api/integrations/csv/upload route (multipart/form-data)

import { parse } from 'csv-parse/sync';
// Note: csv-parse v5+ uses this import path
import { ingestEvent } from '../ingestion/eventIngestion';

export interface CSVRow {
  [key: string]: string;
}

/**
 * Parse CSV file buffer
 */
export function parseCSV(buffer: Buffer, options?: { delimiter?: string; headers?: boolean }): CSVRow[] {
  const delimiter = options?.delimiter || ',';
  const hasHeaders = options?.headers !== false;

  const records = parse(buffer.toString('utf-8'), {
    columns: hasHeaders,
    skip_empty_lines: true,
    delimiter,
    trim: true,
  });

  return records;
}

/**
 * Map CSV row to event payload
 * Supports flexible column mapping
 */
export function mapCSVRowToPayload(
  row: CSVRow,
  columnMapping?: {
    phone?: string;
    email?: string;
    loyalty_id?: string;
    event_type?: string;
    total?: string;
    timestamp?: string;
    [key: string]: string | undefined;
  }
): any {
  const mapping = columnMapping || {
    phone: 'phone',
    email: 'email',
    loyalty_id: 'loyalty_id',
    event_type: 'event_type',
    total: 'total',
    timestamp: 'timestamp',
  };

  const payload: any = {
    ...row, // Include all original columns
    // Map standard fields
    phone: row[mapping.phone || 'phone'],
    email: row[mapping.email || 'email'],
    loyalty_id: row[mapping.loyalty_id || 'loyalty_id'],
    total: row[mapping.total || 'total'] ? parseFloat(row[mapping.total || 'total']) : undefined,
    timestamp: row[mapping.timestamp || 'timestamp'],
    source: 'csv_import',
  };

  return payload;
}

/**
 * Process CSV import
 */
export async function processCSVImport(
  brandId: string,
  csvBuffer: Buffer,
  options?: {
    delimiter?: string;
    columnMapping?: Record<string, string>;
    defaultEventType?: string;
  }
): Promise<{
  success: boolean;
  processed: number;
  errors: Array<{ row: number; error: string }>;
  results: Array<{ eventId: string; profileId?: string }>;
}> {
  const errors: Array<{ row: number; error: string }> = [];
  const results: Array<{ eventId: string; profileId?: string }> = [];

  try {
    // Parse CSV
    const rows = parseCSV(csvBuffer, {
      delimiter: options?.delimiter,
      headers: true,
    });

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const payload = mapCSVRowToPayload(row, options?.columnMapping);
        const eventType = payload.event_type || options?.defaultEventType || 'csv_import';

        const result = await ingestEvent({
          brandId,
          eventType,
          payload,
        });

        results.push({
          eventId: result.eventId,
          profileId: result.profileId || undefined,
        });
      } catch (error) {
        errors.push({
          row: i + 1,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      success: errors.length === 0,
      processed: results.length,
      errors,
      results,
    };
  } catch (error) {
    throw new Error(`CSV parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

