// GENERATOR: REDIS_STREAMS
// ASSUMPTIONS: Redis available, consumer groups will be created
// HOW TO RUN: tsx src/scripts/startStreamWorkers.ts
// TODO: Add graceful shutdown, process management (PM2), and monitoring

import dotenv from 'dotenv';
import {
  initializeConsumerGroups,
  startEventProcessor,
  startMergeProcessor,
  startPredictionProcessor,
} from '../services/streams/streamConsumers';

dotenv.config();

async function main() {
  console.log('🚀 Starting Redis Streams workers...');

  try {
    // Initialize consumer groups
    await initializeConsumerGroups();

    // Start all processors (they run in infinite loops)
    // In production, run these as separate processes/containers
    const processors = [
      startEventProcessor(),
      startMergeProcessor(),
      startPredictionProcessor(),
    ];

    // Wait for all processors (they run forever)
    await Promise.all(processors);
  } catch (error) {
    console.error('Error starting stream workers:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down stream workers...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down stream workers...');
  process.exit(0);
});

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

