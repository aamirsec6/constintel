# Redis Streams Setup - Event Pipeline Architecture

**Last Updated**: December 2024

## Overview

Redis Streams provides the event pipeline infrastructure for the Unified Commerce Platform. It enables:
- **Async event processing** - Decouple event ingestion from processing
- **Scalability** - Multiple consumers can process events in parallel
- **Reliability** - Consumer groups ensure messages are processed
- **Observability** - Stream monitoring and pending message tracking

## Stream Topics

### 1. `events.raw`
**Purpose**: Raw events as they arrive from all sources

**Published by**: Event ingestion service  
**Consumed by**: Event processors (future: normalization, validation)

**Message Format**:
```json
{
  "event_id": "uuid",
  "brand_id": "string",
  "event_type": "purchase|page_view|whatsapp_message",
  "payload": "JSON string",
  "timestamp": "ISO 8601"
}
```

### 2. `events.normalized`
**Purpose**: Events after normalization and profile matching

**Published by**: Event ingestion service  
**Consumed by**: Feature builders, ML triggers, analytics

**Message Format**:
```json
{
  "event_id": "uuid",
  "brand_id": "string",
  "event_type": "string",
  "profile_id": "uuid or empty",
  "identifiers": "JSON string",
  "normalized_payload": "JSON string",
  "timestamp": "ISO 8601"
}
```

### 3. `profiles.merge_requests`
**Purpose**: Profile merge requests (auto or manual)

**Published by**: Profile merger service  
**Consumed by**: Merge processors, manual review queue

**Message Format**:
```json
{
  "brand_id": "string",
  "profile_ids": "JSON array string",
  "reason": "identifier_match|manual_review",
  "requires_manual_review": "true|false",
  "timestamp": "ISO 8601"
}
```

### 4. `predictions.requests`
**Purpose**: ML prediction requests

**Published by**: Backend API (future)  
**Consumed by**: ML service workers (future)

**Message Format**:
```json
{
  "profile_id": "uuid",
  "brand_id": "string",
  "request_type": "churn|ltv|segment|all",
  "timestamp": "ISO 8601"
}
```

## Consumer Groups

### `event-processors`
- **Stream**: `events.normalized`
- **Purpose**: Process normalized events (feature building, analytics)
- **Workers**: Can run multiple instances for parallel processing

### `merge-processors`
- **Stream**: `profiles.merge_requests`
- **Purpose**: Handle merge requests and create manual review queue entries
- **Workers**: Single instance recommended

### `prediction-processors`
- **Stream**: `predictions.requests`
- **Purpose**: Trigger ML predictions asynchronously
- **Workers**: Can run multiple instances

## Setup

### 1. Start Redis

```bash
# Using Docker Compose
docker-compose -f infra/docker-compose.yml up -d redis

# Or standalone
redis-server
```

### 2. Initialize Consumer Groups

Consumer groups are automatically created when workers start, or manually:

```typescript
import { initializeConsumerGroups } from './services/streams/streamConsumers';

await initializeConsumerGroups();
```

### 3. Start Stream Workers

```bash
# Start all workers
cd backend
npm run streams:workers

# Or run individual processors programmatically
import { startEventProcessor } from './services/streams/streamConsumers';
startEventProcessor();
```

## Usage

### Publishing Events

Events are automatically published when ingested:

```typescript
import { ingestEvent } from './services/ingestion/eventIngestion';

// This automatically publishes to streams
await ingestEvent({
  brandId: 'test-brand',
  eventType: 'purchase',
  payload: { phone: '+1234567890', total: 99.99 }
});
```

### Manual Publishing

```typescript
import { publishRawEvent, publishNormalizedEvent } from './services/streams/eventPublisher';

// Publish raw event
await publishRawEvent({
  eventId: 'event-123',
  brandId: 'test-brand',
  eventType: 'purchase',
  payload: { ... },
  timestamp: new Date().toISOString()
});

// Publish normalized event
await publishNormalizedEvent({
  eventId: 'event-123',
  brandId: 'test-brand',
  eventType: 'purchase',
  profileId: 'profile-456',
  identifiers: { phone: '+1234567890' },
  normalizedPayload: { ... },
  timestamp: new Date().toISOString()
});
```

### Reading from Streams

```typescript
import { readFromStream } from './services/streams/redisStreams';
import { STREAM_TOPICS } from './services/streams/redisStreams';

// Read last 10 messages
const messages = await readFromStream(STREAM_TOPICS.EVENTS_RAW, '0', 10);

// Read from specific message ID
const messages = await readFromStream(STREAM_TOPICS.EVENTS_RAW, '1234567890-0', 10);
```

### Using Consumer Groups

```typescript
import { readFromStreamBlocking, acknowledgeMessage } from './services/streams/redisStreams';

// Read with consumer group (blocks until messages arrive)
const messages = await readFromStreamBlocking(
  STREAM_TOPICS.EVENTS_NORMALIZED,
  'event-processors',
  'worker-1',
  5000, // Block for 5 seconds
  10    // Read up to 10 messages
);

// Process messages
for (const message of messages) {
  // Process message
  await processMessage(message.fields);
  
  // Acknowledge processing
  await acknowledgeMessage(
    STREAM_TOPICS.EVENTS_NORMALIZED,
    'event-processors',
    message.id
  );
}
```

## API Endpoints

### Get Stream Info
```bash
GET /api/streams/info
```

Returns info about all streams (length, first/last entries).

### Read Stream
```bash
GET /api/streams/:streamName?startId=0&count=10
```

Read messages from a stream.

**Example**:
```bash
curl http://localhost:3000/api/streams/events.raw?count=5
```

### Get Pending Messages
```bash
GET /api/streams/:streamName/pending?group=event-processors&count=10
```

Get pending messages for a consumer group.

## Monitoring

### Check Stream Length
```bash
# Via API
curl http://localhost:3000/api/streams/info

# Via Redis CLI
redis-cli XLEN events.raw
redis-cli XLEN events.normalized
```

### Check Pending Messages
```bash
# Via API
curl "http://localhost:3000/api/streams/events.normalized/pending?group=event-processors"

# Via Redis CLI
redis-cli XPENDING events.normalized event-processors
```

### View Stream Messages
```bash
# Via Redis CLI - last 10 messages
redis-cli XREVRANGE events.raw + - COUNT 10

# Via Redis CLI - range
redis-cli XRANGE events.raw - + COUNT 10
```

## Production Considerations

### 1. Stream Retention
Streams are configured with `MAXLEN` to prevent unbounded growth:
- `events.raw`: 10,000 messages
- `events.normalized`: 10,000 messages
- `profiles.merge_requests`: 1,000 messages
- `predictions.requests`: 5,000 messages

### 2. Consumer Group Management
- Use unique consumer names per worker instance
- Monitor pending messages for stuck consumers
- Implement dead letter queue for failed messages (future)

### 3. Error Handling
- Messages are not acknowledged on error (will be retried)
- Pending messages can be claimed by other consumers after idle time
- Implement exponential backoff for retries

### 4. Scaling
- Run multiple worker instances for parallel processing
- Use consumer groups to distribute load
- Monitor stream length and consumer lag

## Future Enhancements

1. **Dead Letter Queue**: Failed messages after N retries
2. **Stream Replay**: Replay events from a specific point
3. **Metrics**: Stream length, consumer lag, processing rate
4. **Alerting**: Alert on high pending message count
5. **Kafka Migration**: Easy migration path to Kafka/Redpanda

## Troubleshooting

### Stream Not Found
- Streams are created automatically on first publish
- Check Redis connection: `redis-cli PING`

### Consumer Group Not Found
- Groups are created automatically when workers start
- Or manually: `initializeConsumerGroups()`

### Messages Not Processing
- Check pending messages: `GET /api/streams/:stream/pending`
- Verify consumer is running: Check worker logs
- Claim pending messages: Workers automatically claim idle messages

### High Memory Usage
- Reduce `MAXLEN` values in `eventPublisher.ts`
- Archive old messages to cold storage (future)

