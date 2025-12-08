// GENERATOR: ONBOARDING_SYSTEM
// Infrastructure provisioning status email template

export interface ProvisioningStatusEmailData {
  brandName: string;
  email: string;
  status: 'started' | 'completed' | 'failed';
  instanceUrl?: string;
  errorMessage?: string;
  dashboardUrl: string;
}

export function generateProvisioningStatusEmail(data: ProvisioningStatusEmailData): string {
  const { brandName, email, status, instanceUrl, errorMessage, dashboardUrl } = data;

  let statusContent = '';
  let statusColor = '#2563eb';

  if (status === 'completed') {
    statusColor = '#10b981';
    statusContent = `
      <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 20px; margin: 30px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 16px; color: #065f46;">
          <strong>✅ Your infrastructure is ready!</strong><br>
          Your isolated environment has been successfully provisioned and is now available.
        </p>
      </div>
      
      ${instanceUrl ? `
      <div style="text-align: center; margin: 40px 0;">
        <a href="${instanceUrl}" style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Access Your Instance</a>
      </div>
      ` : ''}
    `;
  } else if (status === 'started') {
    statusColor = '#f59e0b';
    statusContent = `
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 30px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 16px; color: #92400e;">
          <strong>⏳ Infrastructure provisioning in progress</strong><br>
          We're setting up your isolated environment. This typically takes 2-5 minutes. You'll receive another email when it's ready!
        </p>
      </div>
      
      <p style="font-size: 16px; margin-top: 20px;">
        You can track the progress in your dashboard.
      </p>
    `;
  } else if (status === 'failed') {
    statusColor = '#ef4444';
    statusContent = `
      <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 20px; margin: 30px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 16px; color: #991b1b;">
          <strong>❌ Infrastructure provisioning failed</strong><br>
          ${errorMessage || 'An error occurred while setting up your infrastructure. Our team has been notified and will assist you shortly.'}
        </p>
      </div>
      
      <p style="font-size: 16px; margin-top: 20px;">
        Please contact our support team or try again from your dashboard.
      </p>
    `;
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Infrastructure Status - ConstIntel</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: ${statusColor}; margin: 0; font-size: 28px;">Infrastructure Status Update</h1>
    </div>
    
    <p style="font-size: 16px; margin-bottom: 20px;">Hi there,</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      This is an update regarding the infrastructure provisioning for <strong>${brandName}</strong>.
    </p>
    
    ${statusContent}
    
    <div style="text-align: center; margin: 40px 0;">
      <a href="${dashboardUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">View Dashboard</a>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
      If you have any questions or need assistance, please don't hesitate to reach out to our support team.
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

