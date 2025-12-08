// GENERATOR: FULL_PLATFORM
// ASSUMPTIONS: Express app, ingestion service available
// HOW TO RUN: app.use('/api/events', eventsRouter)

import { Router, Request, Response } from 'express';
import { ingestEvent } from '../services/ingestion/eventIngestion';
import { enqueueEvent } from '../services/redis/eventQueue';
import { z } from 'zod';

const router = Router();

const EventSchema = z.object({
  brand_id: z.string().min(1),
  event_type: z.string().min(1),
  payload: z.any(),
});

/**
 * GET /api/events
 * Get recent events (for testing/debugging)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const brandId = req.headers['x-brand-id'] as string || req.query.brandId as string;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const eventType = req.query.eventType as string;

    if (!brandId) {
      return res.status(400).json({
        success: false,
        error: 'x-brand-id header or brandId query parameter required',
      });
    }

    const { getPrismaClient } = await import('../db/prismaClient');
    const prisma = getPrismaClient();

    const where: any = { brandId };
    if (eventType) {
      where.eventType = eventType;
    }

    const events = await prisma.customerRawEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        eventType: true,
        createdAt: true,
        payload: true,
        customerProfileId: true,
      },
    });

    res.json({
      success: true,
      data: events,
      count: events.length,
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/events
 * Ingest a raw event
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const validated = EventSchema.parse({
      brand_id: req.body.brand_id || req.headers['x-brand-id'],
      event_type: req.body.event_type,
      payload: req.body.payload || req.body,
    });

    // Enqueue event for async processing (improves reliability and performance)
    const eventId = await enqueueEvent({
      brandId: validated.brand_id,
      eventType: validated.event_type,
      payload: validated.payload,
      timestamp: new Date().toISOString(),
    });

    // Return immediately (event will be processed by worker)
    res.status(201).json({
      success: true,
      data: {
        eventId,
        queued: true,
        message: 'Event queued for processing',
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Error ingesting event:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;

