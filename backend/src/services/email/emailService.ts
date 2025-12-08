// GENERATOR: ONBOARDING_SYSTEM
// Email service for sending transactional emails
// Supports multiple providers (SMTP, SendGrid, AWS SES)
// HOW TO USE: import { sendEmail } from './emailService'

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

let transporter: nodemailer.Transporter | null = null;

/**
 * Initialize email transporter
 */
function getTransporter(): nodemailer.Transporter {
  if (transporter) {
    return transporter;
  }

  const emailProvider = process.env.EMAIL_PROVIDER || 'smtp';
  const fromEmail = process.env.EMAIL_FROM || 'noreply@constintel.com';
  const fromName = process.env.EMAIL_FROM_NAME || 'ConstIntel';

  if (emailProvider === 'sendgrid') {
    // SendGrid via SMTP
    transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
    });
  } else if (emailProvider === 'ses') {
    // AWS SES
    transporter = nodemailer.createTransport({
      host: process.env.AWS_SES_HOST || 'email-smtp.us-east-1.amazonaws.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.AWS_SES_USER,
        pass: process.env.AWS_SES_PASS,
      },
    });
  } else {
    // Default SMTP or console (for development)
    if (process.env.NODE_ENV === 'development' && !process.env.SMTP_HOST) {
      // Development mode: just log emails
      transporter = nodemailer.createTransport({
        streamTransport: true,
        newline: 'unix',
        buffer: true,
      });
    } else {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'localhost',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER
          ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            }
          : undefined,
      });
    }
  }

  return transporter;
}

/**
 * Send an email
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  const transporter = getTransporter();
  const fromEmail = process.env.EMAIL_FROM || 'noreply@constintel.com';
  const fromName = process.env.EMAIL_FROM_NAME || 'ConstIntel';

  const mailOptions = {
    from: options.from || `"${fromName}" <${fromEmail}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    replyTo: options.replyTo || fromEmail,
  };

  try {
    if (process.env.NODE_ENV === 'development' && !process.env.SMTP_HOST) {
      // In development without SMTP, just log the email
      console.log('📧 Email (dev mode - not sent):');
      console.log('To:', mailOptions.to);
      console.log('Subject:', mailOptions.subject);
      console.log('HTML:', mailOptions.html.substring(0, 200) + '...');
      return;
    }

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
  } catch (error: any) {
    console.error('Failed to send email:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

/**
 * Verify email transporter configuration
 */
export async function verifyEmailConfig(): Promise<boolean> {
  try {
    const transporter = getTransporter();
    await transporter.verify();
    return true;
  } catch (error) {
    console.error('Email configuration error:', error);
    return false;
  }
}

