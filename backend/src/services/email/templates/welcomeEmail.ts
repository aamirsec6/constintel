// GENERATOR: ONBOARDING_SYSTEM
// Welcome email template for new brand signups

export interface WelcomeEmailData {
  brandName: string;
  email: string;
  dashboardUrl: string;
  supportEmail: string;
}

export function generateWelcomeEmail(data: WelcomeEmailData): string {
  const { brandName, email, dashboardUrl, supportEmail } = data;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ConstIntel</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Welcome to ConstIntel!</h1>
    </div>
    
    <p style="font-size: 16px; margin-bottom: 20px;">Hi there,</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      Welcome to <strong>ConstIntel</strong>! We're excited to have <strong>${brandName}</strong> join our platform.
    </p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      Your brand account has been created and your isolated infrastructure is being provisioned. You'll receive another email once everything is ready!
    </p>
    
    <div style="background-color: #f0f9ff; border-left: 4px solid #2563eb; padding: 20px; margin: 30px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px; color: #1e40af;">
        <strong>📧 Your Login:</strong><br>
        Email: ${email}
      </p>
    </div>
    
    <div style="text-align: center; margin: 40px 0;">
      <a href="${dashboardUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Access Your Dashboard</a>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    
    <h2 style="font-size: 20px; margin-bottom: 15px;">What's Next?</h2>
    <ol style="padding-left: 20px; font-size: 16px;">
      <li style="margin-bottom: 10px;">Complete your onboarding setup</li>
      <li style="margin-bottom: 10px;">Connect your integrations (Shopify, WooCommerce, etc.)</li>
      <li style="margin-bottom: 10px;">Start tracking your customer data</li>
      <li style="margin-bottom: 10px;">Explore the analytics dashboard</li>
    </ol>
    
    <p style="font-size: 16px; margin-top: 30px;">
      If you have any questions, feel free to reach out to us at <a href="mailto:${supportEmail}" style="color: #2563eb;">${supportEmail}</a>.
    </p>
    
    <p style="font-size: 16px; margin-top: 30px;">
      Best regards,<br>
      <strong>The ConstIntel Team</strong>
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280;">
    <p>This email was sent to ${email}</p>
    <p>&copy; ${new Date().getFullYear()} ConstIntel. All rights reserved.</p>
  </div>
</body>
</html>
  `.trim();
}

