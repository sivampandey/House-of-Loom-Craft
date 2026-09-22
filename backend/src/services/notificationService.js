// Notification Service for House of Loom & Craft Support & Complaint Escalations
// Supports resilient, non-blocking WhatsApp Business API and Email dispatch

import { SupportTicket } from '../models/SupportTicket.js';

/**
 * Dispatch WhatsApp notification to the official shop contact
 * Server-side execution only. Never exposes tokens to client.
 */
export const notifyShopViaWhatsApp = async (ticket) => {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const primaryPhone = (process.env.SHOP_WHATSAPP_NUMBER || '917460007382').replace(/[^\d]/g, '');
  const secondaryPhone = (process.env.SHOP_WHATSAPP_NUMBER_SECONDARY || '919839116625').replace(/[^\d]/g, '');

  if (!accessToken || !phoneNumberId) {
    console.log('[NotificationService] WhatsApp API credentials not configured. Skipping WhatsApp dispatch.');
    return { status: 'not_configured', message: 'WhatsApp API credentials not configured.' };
  }

  const recipients = [primaryPhone];
  if (secondaryPhone && secondaryPhone !== primaryPhone) {
    recipients.push(secondaryPhone);
  }

  const messageBody = `🚨 *New Customer Support Ticket*

*Ticket:* ${ticket.ticketId}

*Customer:*
Name: ${ticket.customerName || 'Valued Client'}
Phone: ${ticket.customerPhone || 'Not provided'}
Email: ${ticket.customerEmail}

*Order:*
${ticket.orderNumber ? `#${ticket.orderNumber}` : 'General Inquiry / No order specified'}

*Category:*
${ticket.category} (Priority: ${ticket.priority})

*Customer Message:*
"${ticket.customerMessage}"

*AI Summary:*
${ticket.aiSummary || 'Customer submitted an atelier assistance request.'}

*Suggested Next Step:*
${ticket.aiSuggestedResolution || 'Review inquiry details and follow up with the client.'}

*Status:*
${ticket.status.toUpperCase()}
`.trim();

  const sendToRecipient = async (recipient) => {
    try {
      const response = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: recipient,
          type: 'text',
          text: {
            preview_url: false,
            body: messageBody
          }
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        console.warn(`[NotificationService WhatsApp Error for ${recipient}]:`, data.error?.message || response.statusText);
        return { recipient, status: 'failed', error: data.error?.message || response.statusText };
      }

      return { recipient, status: 'sent', messageId: data.messages?.[0]?.id };
    } catch (err) {
      console.warn(`[NotificationService WhatsApp Exception for ${recipient}]:`, err.message);
      return { recipient, status: 'failed', error: err.message };
    }
  };

  try {
    const results = await Promise.allSettled(recipients.map(r => sendToRecipient(r)));
    const primaryResult = results[0]?.status === 'fulfilled' ? results[0].value : { status: 'failed', error: 'Primary recipient failed' };
    return primaryResult;
  } catch (err) {
    console.warn('[NotificationService WhatsApp Exception]:', err.message);
    return { status: 'failed', error: err.message };
  }
};

/**
 * Dispatch Email notification to the configured shop support mailbox
 */
export const notifyShopViaEmail = async (ticket) => {
  const shopEmail = process.env.SHOP_SUPPORT_EMAIL || 'Potteryrugs@gmail.com';
  const fromEmail = process.env.EMAIL_FROM || 'House of Loom & Craft Atelier <Potteryrugs@gmail.com>';
  const provider = (process.env.EMAIL_PROVIDER || 'resend').toLowerCase();
  const apiKey = process.env.EMAIL_API_KEY;

  const subject = `[Support Ticket ${ticket.ticketId}] ${ticket.category} ${ticket.orderNumber ? `— Order #${ticket.orderNumber}` : ''}`.trim();

  const textContent = `
House of Loom & Craft — Atelier Support Desk
=============================================
Support Ticket: ${ticket.ticketId}
Priority: ${ticket.priority} | Status: ${ticket.status}

CUSTOMER DETAILS:
Name: ${ticket.customerName}
Email: ${ticket.customerEmail}
Phone: ${ticket.customerPhone || 'Not provided'}
Order Ref: ${ticket.orderNumber ? `#${ticket.orderNumber}` : 'N/A'}

CUSTOMER'S INQUIRY:
"${ticket.customerMessage}"

AI ASSISTANT SUMMARY:
${ticket.aiSummary || 'Customer requested assistance with an atelier order or craftsmanship inquiry.'}

SUGGESTED RESOLUTION:
${ticket.aiSuggestedResolution || 'Contact client to provide personalized assistance.'}

${ticket.conversationContext && ticket.conversationContext.length > 0 ? `
CONVERSATION CONTEXT:
${ticket.conversationContext.map(c => `[${c.role.toUpperCase()}]: ${c.content}`).join('\n')}
` : ''}

Log in to the atelier admin portal (/admin/support) to view attachments, add internal notes, or resolve this ticket.
`.trim();

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #F7F4EE; color: #2B2118; margin: 0; padding: 24px; }
    .card { max-width: 600px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E2DDD5; border-radius: 12px; overflow: hidden; }
    .header { background: #34402D; color: #FAF7F0; padding: 24px; }
    .header h2 { margin: 0; font-family: Georgia, serif; font-size: 20px; font-weight: normal; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-top: 8px; }
    .badge-urgent { background: #FEE2E2; color: #991B1B; }
    .badge-high { background: #FFEDD5; color: #9A3412; }
    .badge-normal { background: #E0E7FF; color: #3730A3; }
    .section { padding: 20px 24px; border-bottom: 1px solid #F0ECE1; }
    .section h3 { margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #6E6155; }
    .quote { background: #FAF7F2; border-left: 3px solid #34402D; padding: 12px 16px; margin: 8px 0; font-style: italic; border-radius: 4px; }
    .context-box { font-size: 12px; line-height: 1.5; color: #55483C; background: #FAF8F5; padding: 12px; border-radius: 6px; }
    .footer { padding: 16px 24px; background: #F7F4EE; font-size: 11px; color: #8C7D70; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h2>House of Loom &amp; Craft — Support Alert</h2>
      <div style="margin-top: 8px;">
        <span style="font-size: 14px; font-weight: 600;">Ticket ${ticket.ticketId}</span> &bull; 
        <span>${ticket.category}</span>
        <span class="badge ${ticket.priority === 'Urgent' ? 'badge-urgent' : ticket.priority === 'High' ? 'badge-high' : 'badge-normal'}">${ticket.priority}</span>
      </div>
    </div>
    <div class="section">
      <h3>Customer Information</h3>
      <p style="margin: 4px 0;"><strong>Name:</strong> ${ticket.customerName}</p>
      <p style="margin: 4px 0;"><strong>Email:</strong> <a href="mailto:${ticket.customerEmail}">${ticket.customerEmail}</a></p>
      <p style="margin: 4px 0;"><strong>Phone:</strong> ${ticket.customerPhone || 'Not provided'}</p>
      <p style="margin: 4px 0;"><strong>Order Reference:</strong> ${ticket.orderNumber ? `#${ticket.orderNumber}` : 'None'}</p>
    </div>
    <div class="section">
      <h3>Customer's Stated Issue</h3>
      <div class="quote">"${ticket.customerMessage}"</div>
    </div>
    <div class="section">
      <h3>AI Diagnostic Summary</h3>
      <p style="margin: 4px 0;">${ticket.aiSummary || 'Client submitted an atelier inquiry.'}</p>
      <h3 style="margin-top: 16px;">Suggested Action</h3>
      <p style="margin: 4px 0; color: #1E40AF; font-weight: 500;">${ticket.aiSuggestedResolution || 'Contact client to offer assistance.'}</p>
    </div>
    ${ticket.conversationContext && ticket.conversationContext.length > 0 ? `
    <div class="section">
      <h3>Relevant Conversation Context</h3>
      <div class="context-box">
        ${ticket.conversationContext.map(c => `<p style="margin: 4px 0;"><strong>${c.role === 'user' ? 'Client' : 'AI Concierge'}:</strong> ${c.content}</p>`).join('')}
      </div>
    </div>
    ` : ''}
    <div class="footer">
      House of Loom &amp; Craft &bull; G.T. Road, Ghosia, Aurai, Bhadohi 221301 U.P.
    </div>
  </div>
</body>
</html>
`.trim();

  // Local development fallback: Log clearly to console
  if (!apiKey) {
    console.log('\n======================================================');
    console.log('[NotificationService Email Local Dev Fallback]');
    console.log(`To: ${shopEmail}`);
    console.log(`Subject: ${subject}`);
    console.log(`Ticket: ${ticket.ticketId}`);
    console.log('======================================================\n');
    return { status: 'sent', simulated: true };
  }

  try {
    if (provider === 'resend') {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [shopEmail],
          subject,
          html: htmlContent,
          text: textContent
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        console.warn('[NotificationService Email Resend Error]:', data.message || response.statusText);
        return { status: 'failed', error: data.message || response.statusText };
      }
      return { status: 'sent', id: data.id };
    }

    if (provider === 'sendgrid') {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: shopEmail }] }],
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
        console.warn('[NotificationService Email Sendgrid Error]:', errorText || response.statusText);
        return { status: 'failed', error: errorText || response.statusText };
      }
      return { status: 'sent' };
    }

    return { status: 'not_configured', message: `Unsupported email provider: ${provider}` };
  } catch (err) {
    console.warn('[NotificationService Email Exception]:', err.message);
    return { status: 'failed', error: err.message };
  }
};

/**
 * Resilient async dispatcher that records notification status without blocking the customer
 */
export const dispatchTicketNotifications = async (ticketId) => {
  try {
    const ticket = await SupportTicket.findOne({ ticketId });
    if (!ticket) return;

    // Dispatch WhatsApp and Email concurrently
    const [waResult, emailResult] = await Promise.allSettled([
      notifyShopViaWhatsApp(ticket),
      notifyShopViaEmail(ticket)
    ]);

    const updates = {};
    if (waResult.status === 'fulfilled') {
      updates['notifications.whatsapp'] = {
        status: waResult.value.status,
        attemptedAt: new Date(),
        error: waResult.value.error || null
      };
    } else {
      updates['notifications.whatsapp'] = {
        status: 'failed',
        attemptedAt: new Date(),
        error: waResult.reason?.message || 'Dispatch failed'
      };
    }

    if (emailResult.status === 'fulfilled') {
      updates['notifications.email'] = {
        status: emailResult.value.status,
        attemptedAt: new Date(),
        error: emailResult.value.error || null
      };
    } else {
      updates['notifications.email'] = {
        status: 'failed',
        attemptedAt: new Date(),
        error: emailResult.reason?.message || 'Dispatch failed'
      };
    }

    await SupportTicket.updateOne({ ticketId }, { $set: updates });
  } catch (err) {
    console.error('[NotificationService dispatchTicketNotifications Exception]:', err.message);
  }
};
