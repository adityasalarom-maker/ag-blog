import type { APIRoute } from 'astro';
import { submitAuthorQuery, checkRateLimit } from '../../../lib/community/communityService.ts';
import { dispatchAuthorQuery } from '../../../lib/email/mailer.ts';
import { getParticipantId } from '../../../lib/community/memberAuth.ts';

export const prerender = false;

/**
 * POST /api/community/queries
 * Submits a private query to the author and dispatches identifiable email notification
 */
export const POST: APIRoute = async ({ request }) => {
  const { participantId, newVisitorCookie } = getParticipantId(request);

  // Rate limit: max 3 queries per 5 minutes per participant
  if (!checkRateLimit(`qry_${participantId}`, 3, 300000)) {
    return new Response(
      JSON.stringify({ success: false, error: 'You have submitted multiple queries recently. Please wait a few minutes before sending another.' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let body: {
    senderName?: string;
    senderEmail?: string;
    category?: any;
    subject?: string;
    message?: string;
    sourceWorkSlug?: string;
    sourceWorkTitle?: string;
    sourceWorkId?: string;
    consentPrivacy?: boolean;
    honeypot?: string;
  };

  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ success: false, error: 'Malformed JSON payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Anti-bot honeypot protection: if field filled, silently return success
  if (body.honeypot && body.honeypot.trim().length > 0) {
    return new Response(
      JSON.stringify({
        success: true,
        queryId: 'QRY-BOT-DROPPED',
        message: 'Your query has been received.'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!body.senderName || !body.senderEmail || !body.category || !body.subject || !body.message) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'All fields (Name, Email, Category, Subject, Message) are required.'
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (body.consentPrivacy !== true) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'You must agree to the privacy notice before submitting a query.'
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 1. Durably record query in local repository
  const recordResult = submitAuthorQuery({
    senderName: body.senderName,
    senderEmail: body.senderEmail,
    category: body.category,
    subject: body.subject,
    message: body.message,
    sourceWorkSlug: body.sourceWorkSlug,
    sourceWorkTitle: body.sourceWorkTitle,
    sourceWorkId: body.sourceWorkId,
    consentPrivacy: true
  });

  if (!recordResult.success || !recordResult.queryId) {
    return new Response(
      JSON.stringify({ success: false, error: recordResult.error || 'Failed to record query' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 2. Dispatch email notification to author
  const dispatchResult = await dispatchAuthorQuery({
    id: recordResult.queryId,
    senderName: body.senderName,
    senderEmail: body.senderEmail,
    category: body.category,
    subject: body.subject,
    message: body.message,
    sourceWorkSlug: body.sourceWorkSlug,
    sourceWorkTitle: body.sourceWorkTitle,
    sourceWorkId: body.sourceWorkId,
    consentPrivacy: true,
    deliveryStatus: 'logged_unverified',
    createdAt: new Date().toISOString()
  });

  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (newVisitorCookie) {
    headers.set('Set-Cookie', newVisitorCookie);
  }

  return new Response(
    JSON.stringify({
      success: true,
      queryId: recordResult.queryId,
      deliveryStatus: dispatchResult.status,
      message: dispatchResult.message,
      emailSubject: dispatchResult.subject
    }),
    { status: 201, headers }
  );
};
