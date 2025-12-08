// GENERATOR: ONBOARDING_SYSTEM
// Secure credential delivery email template

export interface CredentialsEmailData {
  brandName: string;
  email: string;
  loginUrl: string;
  supportEmail: string;
  note?: string;
}

export function generateCredentialsEmail(data: CredentialsEmailData): string {
  const { brandName, email, loginUrl, supportEmail, note } = data;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your ConstIntel Credentials</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Your Account is Ready!</h1>
    </div>
    
    <p style="font-size: 16px; margin-bottom: 20px;">Hi there,</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      Your account for <strong>${brandName}</strong> has been successfully created. You can now access your dashboard using the credentials you set during signup.
    </p>
    
    <div style="background-color: #f0f9ff; border: 2px solid #2563eb; padding: 20px; margin: 30px 0; border-radius: 4px;">
      <p style="margin: 0 0 10px 0; font-size: 14px; color: #1e40af; font-weight: 600;">🔐 Login Information:</p>
      <p style="margin: 5px 0; font-size: 14px; color: #1e40af;">
        <strong>Email:</strong> ${email}
      </p>
      <p style="margin: 5px 0; font-size: 14px; color: #1e40af;">
        <strong>Password:</strong> The password you created during signup
      </p>
    </div>
    
    ${note ? `
    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px; color: #92400e;">${note}</p>
    </div>
    ` : ''}
    
    <div style="text-align: center; margin: 40px 0;">
      <a href="${loginUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Login to Dashboard</a>
    </div>
    
    <div style="background-color: #f9fafb; padding: 20px; margin: 30px 0; border-radius: 4px;">
      <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: 600; color: #374151;">🔒 Security Tips:</p>
      <ul style="margin: 10px 0; padding-left: 20px; font-size: 14px; color: #6b7280;">
        <li>Never share your login credentials</li>
        <li>Use a strong, unique password</li>
        <li>Enable two-factor authentication if available</li>
        <li>Log out when using shared devices</li>
      </ul>
    </div>
    
    <p style="font-size: 16px; margin-top: 30px;">
      If you didn't create this account or have any concerns, please contact us immediately at <a href="mailto:${supportEmail}" style="color: #2563eb;">${supportEmail}</a>.
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

