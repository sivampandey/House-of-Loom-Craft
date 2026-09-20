// Luxury Editorial Email Service for House of Loom & Craft
// Supports Resend, SendGrid, and Development Fallback

export const sendPasswordResetEmail = async ({ toEmail, recipientName, resetToken }) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const defaultFrontendUrl = isProduction ? 'https://pottery-rugs.vercel.app' : 'http://localhost:5173';
  const frontendUrl = (process.env.FRONTEND_URL || defaultFrontendUrl).replace(/\/$/, '');
  const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
  const fromEmail = process.env.EMAIL_FROM || 'House of Loom & Craft <Potteryrugs@gmail.com>';
  const provider = (process.env.EMAIL_PROVIDER || 'resend').toLowerCase();
  const apiKey = process.env.EMAIL_API_KEY;

  const subject = 'Atelier Access: Password Recovery Request';

  const textContent = `
House of Loom & Craft — Bhadohi Atelier

Salutations ${recipientName || 'Valued Client'},

We received a request to reset your client credentials for House of Loom & Craft.

Please access the secure atelier link below to establish a new password:
${resetUrl}

This security authorization will expire in 30 minutes. If you did not initiate this request, no further action is required and your account remains secure.

Atelier Concierge:
G.T. Road, Ghosia, Aurai, Bhadohi 221301 U.P. (India)
+91 9839116625, +91 7460007382 | Potteryrugs@gmail.com
`.trim();

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Password Recovery — House of Loom & Craft</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F5F0E6; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #362B21; }
    .container { max-width: 600px; margin: 40px auto; background-color: #FAF7F0; border: 1px solid #DACDB3; border-radius: 16px; overflow: hidden; }
    .header { background-color: #45553C; padding: 32px 24px; text-align: center; color: #FAF7F0; }
    .header h1 { margin: 0; font-family: Georgia, serif; font-size: 24px; font-weight: normal; letter-spacing: 2px; }
    .header p { margin: 6px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 3px; color: #D4BC9F; }
    .content { padding: 40px 32px; line-height: 1.6; font-size: 14px; }
    .content h2 { font-family: Georgia, serif; font-size: 20px; font-weight: normal; margin-top: 0; color: #362B21; }
    .btn-wrap { text-align: center; margin: 36px 0; }
    .btn { display: inline-block; background-color: #55694A; color: #FAF7F0 !important; text-decoration: none; padding: 14px 32px; border-radius: 999px; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; }
    .notice { font-size: 12px; color: #6D5C4C; border-top: 1px solid #E5DCB8; padding-top: 20px; margin-top: 30px; }
    .link-fallback { font-size: 11px; word-break: break-all; color: #55694A; margin-top: 8px; }
    .footer { background-color: #EFE8D8; padding: 24px; text-align: center; font-size: 11px; color: #6D5C4C; border-top: 1px solid #DACDB3; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>House of Loom &amp; Craft</h1>
      <p>Bhadohi Master Atelier &bull; Est. 2026</p>
    </div>
    <div class="content">
      <h2>Password Recovery Request</h2>
      <p>Greetings ${recipientName ? `<strong>${recipientName}</strong>` : 'Valued Client'},</p>
      <p>We received an inquiry to reset the access credentials for your private atelier account. To establish a new secure password, please select the authorization key below:</p>
      
      <div class="btn-wrap">
        <a href="${resetUrl}" class="btn" target="_blank">Reset Atelier Password</a>
      </div>

      <div class="notice">
        <p><strong>Note on Expiration:</strong> This authorization is valid for <strong>30 minutes</strong> only. If you did not make this request, please disregard this communication; your atelier account remains completely secure.</p>
        <p>If the button above does not open directly, copy and paste this secure link into your browser:</p>
        <p class="link-fallback"><a href="${resetUrl}" style="color: #55694A;">${resetUrl}</a></p>
      </div>
    </div>
    <div class="footer">
      House of Loom &amp; Craft &bull; Manufacturer &amp; Exporter<br>
      G.T. Road, Ghosia, Aurai, Bhadohi 221301 U.P. (India)<br>
      Concierge Helpline: +91 9839116625, +91 7460007382 | Potteryrugs@gmail.com
    </div>
  </div>
</body>
</html>
`.trim();

  // If in production and API key is missing:
  if (process.env.NODE_ENV === 'production' && !apiKey) {
    console.error('[EmailService] EMAIL_API_KEY is not configured in production.');
    throw new Error('Email delivery service is currently not configured. Please contact the atelier concierge.');
  }

  // Development Fallback: If no API key configured in local dev, log safely
  if (!apiKey) {
    console.log('\n======================================================');
    console.log('[EmailService Local Dev Fallback]');
    console.log(`To: ${toEmail}`);
    console.log(`Subject: ${subject}`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log('======================================================\n');
    return { success: true, simulated: true, resetUrl };
  }

  // 1. Resend Provider
  if (provider === 'resend') {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        subject,
        html: htmlContent,
        text: textContent
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(`Resend email delivery failed: ${data.message || response.statusText}`);
    }
    return { success: true, id: data.id };
  }

  // 2. SendGrid Provider
  if (provider === 'sendgrid') {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: toEmail }] }],
        from: { email: fromEmail.includes('<') ? fromEmail.split('<')[1].replace('>', '').trim() : fromEmail },
        subject,
        content: [
          { type: 'text/plain', value: textContent },
          { type: 'text/html', value: htmlContent }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`SendGrid email delivery failed: ${errorText || response.statusText}`);
    }
    return { success: true };
  }

  throw new Error(`Unsupported EMAIL_PROVIDER: "${provider}". Expected 'resend' or 'sendgrid'.`);
};
