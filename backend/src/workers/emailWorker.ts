// GENERATOR: ONBOARDING_SYSTEM
// Background email worker
// Processes email queue jobs and sends emails
// HOW TO RUN: npm run worker:email or tsx src/workers/emailWorker.ts

import { Worker } from 'bull';
import { sendEmail } from '../services/email/emailService';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const emailWorker = new Worker(
  'email',
  async (job) => {
    const { to, subject, html, text, from, replyTo } = job.data;
    
    console.log(`Sending email to ${to}: ${subject}`);
    
    try {
      await sendEmail({
        to,
        subject,
        html,
        text,
        from,
        replyTo,
      });
      
      console.log(`✅ Email sent successfully to ${to}`);
      return { success: true };
    } catch (error: any) {
      console.error(`❌ Failed to send email to ${to}:`, error);
      throw error;
    }
  },
  {
    connection: redisUrl,
    concurrency: 5, // Process 5 emails concurrently
  }
);

emailWorker.on('completed', (job) => {
  console.log(`Email job ${job.id} completed`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`Email job ${job?.id} failed:`, err);
});

emailWorker.on('error', (error) => {
  console.error('Email worker error:', error);
});

console.log('📧 Email worker started. Waiting for jobs...');

// Keep the process alive
process.on('SIGTERM', async () => {
  await emailWorker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await emailWorker.close();
  process.exit(0);
});

