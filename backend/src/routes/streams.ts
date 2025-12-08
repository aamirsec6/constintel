// GENERATOR: REDIS_STREAMS
// ASSUMPTIONS: Redis Streams service available
// HOW TO RUN: app.use('/api/streams', streamsRouter)

import { Router, Request, Response } from 'express';
import {
  getStreamInfo,
  readFromStream,
  getPendingMessages,
  STREAM_TOPICS,
} from '../services/streams/redisStreams';

const router = Router();

/**
 * GET /api/streams/info
 * Get info about all streams
 */
router.get('/info', async (req: Request, res: Response) => {
  try {
    const streams = Object.values(STREAM_TOPICS);
    const info = await Promise.all(
      streams.map(async (stream) => ({
        name: stream,
        ...(await getStreamInfo(stream)),
      }))
    );

    res.json({
      success: true,
      data: info,
    });
  } catch (error) {
    console.error('Error getting stream info:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/streams/:streamName
 * Read messages from a stream
 */
router.get('/:streamName', async (req: Request, res: Response) => {
  try {
    const { streamName } = req.params;
    const startId = (req.query.startId as string) || '0';
    const count = req.query.count ? parseInt(req.query.count as string) : 10;

    if (!Object.values(STREAM_TOPICS).includes(streamName as any)) {
      return res.status(400).json({
        success: false,
        error: `Invalid stream name. Valid streams: ${Object.values(STREAM_TOPICS).join(', ')}`,
      });
    }

    const messages = await readFromStream(streamName, startId, count);

    res.json({
      success: true,
      data: {
        stream: streamName,
        messages,
        count: messages.length,
      },
    });
  } catch (error) {
    console.error('Error reading stream:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/streams/:streamName/pending
 * Get pending messages for a consumer group
 */
router.get('/:streamName/pending', async (req: Request, res: Response) => {
  try {
    const { streamName } = req.params;
    const groupName = req.query.group as string;
    const count = req.query.count ? parseInt(req.query.count as string) : 10;

    if (!groupName) {
      return res.status(400).json({
        success: false,
        error: 'group parameter is required',
      });
    }

    const pending = await getPendingMessages(streamName, groupName, count);

    res.json({
      success: true,
      data: {
        stream: streamName,
        group: groupName,
        pending,
        count: pending.length,
      },
    });
  } catch (error) {
    console.error('Error getting pending messages:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;

