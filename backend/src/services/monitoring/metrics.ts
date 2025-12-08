// GENERATOR: PHASE1_WEEK1_MONITORING
// Prometheus metrics collection for ConstIntel
// HOW TO RUN: Import and use in server.ts

import { Registry, Counter, Histogram, Gauge } from 'prom-client';

// Create a registry
export const register = new Registry();

// Add default metrics (CPU, memory, etc.)
// Note: prom-client doesn't have built-in default metrics, we'll create custom ones

// HTTP Request Metrics
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

// Database Metrics
export const dbQueryDuration = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

export const dbConnectionsActive = new Gauge({
  name: 'db_connections_active',
  help: 'Number of active database connections',
  registers: [register],
});

// Event Processing Metrics
export const eventsIngestedTotal = new Counter({
  name: 'events_ingested_total',
  help: 'Total number of events ingested',
  labelNames: ['event_type', 'brand_id'],
  registers: [register],
});

export const eventsProcessedDuration = new Histogram({
  name: 'events_processed_duration_seconds',
  help: 'Time to process events',
  labelNames: ['event_type'],
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [register],
});

// Profile Merging Metrics
export const profilesMergedTotal = new Counter({
  name: 'profiles_merged_total',
  help: 'Total number of profile merges',
  labelNames: ['merge_type'], // 'auto' or 'manual'
  registers: [register],
});

// ML Service Metrics
export const mlPredictionsTotal = new Counter({
  name: 'ml_predictions_total',
  help: 'Total number of ML predictions',
  labelNames: ['prediction_type'], // 'churn', 'ltv', 'segment', 'recs'
  registers: [register],
});

export const mlPredictionDuration = new Histogram({
  name: 'ml_prediction_duration_seconds',
  help: 'Time to generate ML predictions',
  labelNames: ['prediction_type'],
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [register],
});

// Redis Metrics
export const redisOperationsTotal = new Counter({
  name: 'redis_operations_total',
  help: 'Total number of Redis operations',
  labelNames: ['operation'], // 'get', 'set', 'del', etc.
  registers: [register],
});

export const redisOperationDuration = new Histogram({
  name: 'redis_operation_duration_seconds',
  help: 'Duration of Redis operations',
  labelNames: ['operation'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1],
  registers: [register],
});

// System Metrics
export const activeProfiles = new Gauge({
  name: 'active_profiles',
  help: 'Number of active customer profiles',
  labelNames: ['brand_id'],
  registers: [register],
});

export const queueSize = new Gauge({
  name: 'queue_size',
  help: 'Number of items in queue',
  labelNames: ['queue_name'], // 'events', 'automation'
  registers: [register],
});

// Register all metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(dbQueryDuration);
register.registerMetric(dbConnectionsActive);
register.registerMetric(eventsIngestedTotal);
register.registerMetric(eventsProcessedDuration);
register.registerMetric(profilesMergedTotal);
register.registerMetric(mlPredictionsTotal);
register.registerMetric(mlPredictionDuration);
register.registerMetric(redisOperationsTotal);
register.registerMetric(redisOperationDuration);
register.registerMetric(activeProfiles);
register.registerMetric(queueSize);

