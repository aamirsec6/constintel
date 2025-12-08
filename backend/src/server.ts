// GENERATOR: FULL_PLATFORM
// ASSUMPTIONS: DATABASE_URL, PORT in env, Prisma schema migrated
// HOW TO RUN: npm run dev (or npm start for production)

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import eventsRouter from './routes/events';
import profilesRouter from './routes/profiles';
import healthRouter from './routes/health';
import integrationsRouter from './routes/integrations';
import crmRouter from './routes/crm';
import streamsRouter from './routes/streams';
import intentRouter from './routes/intent';
import storeRouter from './routes/store';
import automationRouter from './routes/automation';
import campaignRouter from './routes/campaign';
import inventoryRouter from './routes/inventory';
import monitoringRouter from './routes/monitoring';
import authRouter from './routes/auth';
import adminRouter from './routes/admin';
import adminMetricsRouter from './routes/admin/metrics';
import adminMarketRouter from './routes/admin/market';
import onboardingRouter from './routes/onboarding';
import provisioningStatusRouter from './routes/provisioning/status';
import notificationsRouter from './routes/notifications';
import customerNotificationsRouter from './routes/customerNotifications';
import timeSeriesRouter from './routes/analytics/timeSeries';
import dashboardRouter from './routes/analytics/dashboard';
import cohortsRouter from './routes/analytics/cohorts';
import funnelsRouter from './routes/analytics/funnels';
import segmentsRouter from './routes/analytics/segments';
import channelsRouter from './routes/analytics/channels';
import predictionsRouter from './routes/analytics/predictions';
import insightsRouter from './routes/analytics/insights';
import askRouter from './routes/analytics/ask';
import anomaliesRouter from './routes/analytics/anomalies';
import reportsRouter from './routes/analytics/reports';
import { register } from './services/monitoring/metrics';

dotenv.config();

const app = express();
const PORT = process.env.BACKEND_PORT || process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve tracker script
app.get('/constintel-tracker.js', (req, res) => {
  const trackerPath = path.join(__dirname, '../../frontend/public/constintel-tracker.js');
  if (fs.existsSync(trackerPath)) {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(trackerPath);
  } else {
    res.status(404).send('Tracker script not found');
  }
});

// Request logging (non-PII)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/health', healthRouter);

// Prometheus metrics endpoint (must be at /metrics for Prometheus)
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(error instanceof Error ? error.message : 'Unknown error');
  }
});

app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/admin/metrics', adminMetricsRouter);
app.use('/api/admin/market', adminMarketRouter);
app.use('/api/onboarding', onboardingRouter);
app.use('/api/provisioning/status', provisioningStatusRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/analytics/dashboard', dashboardRouter);
app.use('/api/analytics/timeseries', timeSeriesRouter);
app.use('/api/analytics/cohorts', cohortsRouter);
app.use('/api/analytics/funnels', funnelsRouter);
app.use('/api/analytics/segments', segmentsRouter);
app.use('/api/analytics/channels', channelsRouter);
app.use('/api/analytics/predictions', predictionsRouter);
app.use('/api/analytics/insights', insightsRouter);
app.use('/api/analytics/ask', askRouter);
app.use('/api/analytics/anomalies', anomaliesRouter);
app.use('/api/analytics/reports', reportsRouter);
app.use('/api/events', eventsRouter);
app.use('/api/profiles', profilesRouter);
app.use('/api/integrations', integrationsRouter);
app.use('/api/integrations/crm', crmRouter);
app.use('/api/streams', streamsRouter);
app.use('/api/intent', intentRouter);
app.use('/api/store', storeRouter);
app.use('/api/automation', automationRouter);
app.use('/api/campaign', campaignRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/monitoring', monitoringRouter);
app.use('/api/customer-notifications', customerNotificationsRouter);

// Root
app.get('/', (req, res) => {
  res.json({
    name: 'ConstIntel Unified Commerce Platform API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      analytics: {
        timeSeries: '/api/analytics/timeseries',
        cohorts: '/api/analytics/cohorts',
        funnels: '/api/analytics/funnels',
        segments: '/api/analytics/segments',
        channels: '/api/analytics/channels',
        predictions: '/api/analytics/predictions',
      },
      events: '/api/events',
      profiles: '/api/profiles',
      integrations: '/api/integrations',
      crm: '/api/integrations/crm',
      streams: '/api/streams',
      intent: '/api/intent',
      store: '/api/store',
      automation: '/api/automation',
      campaign: '/api/campaign',
      inventory: '/api/inventory',
    },
  });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

