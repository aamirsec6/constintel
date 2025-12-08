// GENERATOR: CUSTOMER_NOTIFICATIONS
// Email digest notification service
// HOW TO RUN: Import and use to send email digests

import nodemailer from 'nodemailer';
import { Digest } from './digestAggregationService';

// Create transporter (use existing email configuration)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

/**
 * Send email digest notification
 */
export async function sendEmailDigest(email: string, digest: Digest): Promise<void> {
  const subject = `Your ${digest.summary.total_events > 0 ? digest.period.split(' ')[0] : 'Daily'} Customer Activity Summary`;
  const html = generateEmailTemplate(digest);
  
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject,
      html
    });
  } catch (error) {
    console.error('Error sending email digest:', error);
    throw error;
  }
}

function generateEmailTemplate(digest: Digest): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4f46e5; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
    .content { background: #f9fafb; padding: 20px; border-radius: 0 0 5px 5px; }
    .stat { display: inline-block; margin: 10px; padding: 15px; background: white; border-radius: 5px; text-align: center; min-width: 120px; }
    .stat-value { font-size: 24px; font-weight: bold; color: #4f46e5; }
    .stat-label { font-size: 12px; color: #666; margin-top: 5px; }
    .event-list { margin-top: 20px; }
    .event-item { background: white; padding: 10px; margin: 5px 0; border-radius: 3px; border-left: 3px solid #4f46e5; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Customer Activity Summary</h1>
      <p>${digest.period}</p>
    </div>
    <div class="content">
      <h2>Summary</h2>
      <div class="stat">
        <div class="stat-value">${digest.summary.new_customers}</div>
        <div class="stat-label">New Customers</div>
      </div>
      <div class="stat">
        <div class="stat-value">${digest.summary.purchases}</div>
        <div class="stat-label">Purchases</div>
      </div>
      <div class="stat">
        <div class="stat-value">${digest.summary.total_events}</div>
        <div class="stat-label">Total Events</div>
      </div>
      
      <div class="event-list">
        <h3>Event Breakdown</h3>
        ${digest.events.map(event => `
          <div class="event-item">
            <strong>${event.type.replace('_', ' ').toUpperCase()}</strong>: ${event.count} events
          </div>
        `).join('')}
      </div>
      
      <div class="footer">
        <p>View full details in your ConstIntel dashboard</p>
        <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/dashboard">Go to Dashboard</a></p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

