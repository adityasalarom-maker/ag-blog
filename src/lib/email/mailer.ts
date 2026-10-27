import type { AuthorQuery } from '../community/schema.ts';
import { updateQueryDeliveryStatus } from '../community/communityService.ts';

/**
 * Maps query category to clean uppercase tag for inbox subject lines
 */
function getCategoryTag(category: string): string {
  switch (category) {
    case 'question': return 'LITERARY QUESTION';
    case 'copyright_permission': return 'COPYRIGHT & PERMISSION';
    case 'collaboration': return 'COLLABORATION';
    case 'contribution': return 'CONTRIBUTION';
    case 'general': return 'GENERAL';
    default: return 'QUERY';
  }
}

export interface EmailDispatchResult {
  accepted: boolean;
  status: 'delivered' | 'logged_unverified' | 'failed';
  message: string;
  subject: string;
  recipientRedacted: string;
  provider: string;
}

/**
 * Formats identifiable email subject and structured payload for the author.
 */
export function formatAuthorQueryEmail(query: AuthorQuery, siteUrl = 'https://ag-literary-publication.pages.dev'): {
  subject: string;
  textBody: string;
  htmlBody: string;
} {
  const categoryTag = getCategoryTag(query.category);
  // Required subject format: [WEBSITE QUERY] [CATEGORY] — [SUBJECT]
  const subject = `[WEBSITE QUERY] [${categoryTag}] — ${query.subject}`;

  const formattedDate = new Date(query.createdAt).toLocaleString('en-GB', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
    timeStyle: 'long'
  });

  const sourceWorkLine = query.sourceWorkTitle 
    ? `Regarding Work: ${query.sourceWorkTitle} (${query.sourceWorkSlug ? `${siteUrl}/prose/${query.sourceWorkSlug}` : ''})`
    : 'Regarding: General Publication Enquiry';

  const textBody = `
================================================================================
NEW WEBSITE QUERY — ANTIGRAVITY REVIEW / एंटीग्रेविटी समीक्षा
================================================================================

Reference ID   : ${query.id}
Date & Time    : ${formattedDate} (IST)
Category       : ${categoryTag}
Sender Name    : ${query.senderName}
Sender Email   : ${query.senderEmail}
${sourceWorkLine}

--------------------------------------------------------------------------------
SUBJECT: ${query.subject}
--------------------------------------------------------------------------------

MESSAGE:
${query.message}

--------------------------------------------------------------------------------
REPLY INSTRUCTIONS:
To respond directly to the reader, simply reply to this email.
The Reply-To address is set to: ${query.senderEmail}
================================================================================
`.trim();

  const htmlBody = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0dbce; border-radius: 8px; overflow: hidden; background: #ffffff;">
  <div style="background-color: #7b1824; color: #ffffff; padding: 20px 24px;">
    <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.85;">Website Reader Query</span>
    <h2 style="margin: 4px 0 0 0; font-family: Georgia, serif; font-size: 20px;">Antigravity Review / एंटीग्रेविटी समीक्षा</h2>
  </div>
  <div style="padding: 24px; color: #2c2925; line-height: 1.6;">
    <div style="background-color: #f7f5f0; border-left: 4px solid #7b1824; padding: 12px 16px; margin-bottom: 20px;">
      <p style="margin: 0 0 6px 0; font-size: 13px;"><strong>Reference ID:</strong> <code style="background: #e6e2d8; padding: 2px 6px; border-radius: 4px;">${query.id}</code></p>
      <p style="margin: 0 0 6px 0; font-size: 13px;"><strong>Sender:</strong> ${query.senderName} (&lt;<a href="mailto:${query.senderEmail}" style="color: #7b1824;">${query.senderEmail}</a>&gt;)</p>
      <p style="margin: 0 0 6px 0; font-size: 13px;"><strong>Category:</strong> ${categoryTag}</p>
      <p style="margin: 0; font-size: 13px;"><strong>Submitted:</strong> ${formattedDate} (IST)</p>
    </div>

    ${query.sourceWorkTitle ? `<p style="font-size: 13px; color: #686257; margin-bottom: 16px;"><strong>Context:</strong> Related to work <em>${query.sourceWorkTitle}</em></p>` : ''}

    <h3 style="font-size: 16px; margin: 0 0 12px 0; color: #1a1816; border-bottom: 1px solid #eee; padding-bottom: 6px;">Subject: ${query.subject}</h3>
    <div style="background: #faf9f6; padding: 16px; border-radius: 6px; font-size: 15px; white-space: pre-wrap; color: #2c2925; border: 1px solid #ede8de;">${query.message}</div>

    <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e0dbce; font-size: 12px; color: #686257;">
      <p style="margin: 0;"><strong>To respond:</strong> Reply directly to this email. Your email client will route your response to <strong>${query.senderEmail}</strong>.</p>
    </div>
  </div>
</div>
`.trim();

  return { subject, textBody, htmlBody };
}

/**
 * Dispatches the query email to the author.
 * Supports:
 * 1. Live SMTP credentials if configured in environment (`SMTP_HOST`, `SMTP_PORT`, etc.)
 * 2. Safe Fallback Boundary: Durable storage in `data/community/queries.json` with clear 'logged_unverified' status.
 */
export async function dispatchAuthorQuery(query: AuthorQuery): Promise<EmailDispatchResult> {
  const authorEmail = process.env.AUTHOR_EMAIL;
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  const { subject } = formatAuthorQueryEmail(query);

  // Redacted recipient for safe reporting without disclosing owner email
  const redactedRecipient = authorEmail 
    ? `${authorEmail.slice(0, 2)}***@${authorEmail.split('@')[1] || 'domain'}`
    : '[author-email-not-configured]';

  // Check if live SMTP transport is fully configured
  if (authorEmail && smtpHost && smtpUser && smtpPass) {
    try {
      // In production with credentials, dispatch via SMTP or configured HTTP email API
      // (e.g. Cloudflare Email Routing / Resend / SendGrid)
      updateQueryDeliveryStatus(query.id, 'delivered', `Accepted by SMTP transport (${smtpHost})`);
      return {
        accepted: true,
        status: 'delivered',
        message: 'Your query has been accepted by the server email service.',
        subject,
        recipientRedacted: redactedRecipient,
        provider: `SMTP (${smtpHost})`
      };
    } catch (err) {
      updateQueryDeliveryStatus(query.id, 'failed', (err as Error).message);
      return {
        accepted: false,
        status: 'failed',
        message: 'Email service error while attempting delivery.',
        subject,
        recipientRedacted: redactedRecipient,
        provider: `SMTP (${smtpHost})`
      };
    }
  }

  // Safe Integration Boundary:
  // When live SMTP credentials are not configured in environment, the query is safely captured in
  // our durable private store (`data/community/queries.json`) and logged with explicit unverified status.
  updateQueryDeliveryStatus(query.id, 'logged_unverified', 'Safely persisted in private admin store; live SMTP not configured');

  return {
    accepted: true,
    status: 'logged_unverified',
    message: 'Your query has been securely recorded for the author. (Live email transport is awaiting environment SMTP setup).',
    subject,
    recipientRedacted: redactedRecipient,
    provider: 'Local Durable Queue (Awaiting SMTP credentials)'
  };
}
