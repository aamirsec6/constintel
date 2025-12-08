// GENERATOR: ONBOARDING_SYSTEM
// Email queue system using Redis/Bull for background processing
// HOW TO USE: Queue emails for async processing

import { Queue } from 'bull';
import dotenv from 'dotenv';

dotenv.config();

let emailQueue: Queue | null = null;

export interface EmailJob {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

/**
 * Get or create email queue
 */
export function getEmailQueue(): Queue {
  if (emailQueue) {
    return emailQueue;
  }

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  emailQueue = new Queue('email', {
    redis: redisUrl,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: {
        age: 3600, // Keep completed jobs for 1 hour
        count: 1000, // Keep max 1000 completed jobs
      },
      removeOnFail: {
        age: 86400, // Keep failed jobs for 24 hours
      },
    },
  });

  return emailQueue;
}

/**
 * Queue an email to be sent
 */
export async function queueEmail(job: EmailJob): Promise<void> {
  const queue = getEmailQueue();
  await queue.add('send-email', job, {
    priority: 1,
  });
}

/**
 * Queue multiple emails
 */
export async function queueEmails(jobs: EmailJob[]): Promise<void> {
  const queue = getEmailQueue();
  const emailJobs = jobs.map((job) => ({
    name: 'send-email',
    data: job,
    opts: {
      priority: 1,
    },
  }));

  await queue.addBulk(emailJobs);
}

