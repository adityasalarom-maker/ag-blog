import type { APIRoute } from 'astro';
import { getCommentsForWork, addComment, checkRateLimit } from '../../../lib/community/communityService.ts';
import { getParticipantId } from '../../../lib/community/memberAuth.ts';

export const prerender = false;

/**
 * GET /api/community/comments?workId=...&page=...&limit=...
 */
export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const workId = url.searchParams.get('workId');
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = parseInt(url.searchParams.get('limit') || '15', 10);

  if (!workId) {
    return new Response(JSON.stringify({ success: false, error: 'workId query parameter is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { participantId, newVisitorCookie } = getParticipantId(request);
  const data = getCommentsForWork(workId, { page, limit, currentParticipantId: participantId });

  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (newVisitorCookie) {
    headers.set('Set-Cookie', newVisitorCookie);
  }

  return new Response(
    JSON.stringify({
      success: true,
      data
    }),
    { status: 200, headers }
  );
};

/**
 * POST /api/community/comments
 * Adds a new comment or threaded reply
 */
export const POST: APIRoute = async ({ request }) => {
  const { participantId, isAuthenticated, memberSession, newVisitorCookie } = getParticipantId(request);

  // Rate limit: max 5 comments every 2 minutes
  if (!checkRateLimit(`cmt_${participantId}`, 5, 120000)) {
    return new Response(
      JSON.stringify({ success: false, error: 'You are submitting comments too quickly. Please pause for a moment.' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let body: {
    workId?: string;
    parentCommentId?: string | null;
    authorName?: string;
    authorEmail?: string;
    content?: string;
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

  // Anti-bot honeypot check: hidden field must remain empty
  if (body.honeypot && body.honeypot.trim().length > 0) {
    // Silently drop bot submission
    return new Response(JSON.stringify({ success: true, message: 'Comment received' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const workId = body.workId?.trim();
  const content = body.content?.trim();
  const authorName = (isAuthenticated && memberSession ? memberSession.name : body.authorName)?.trim();
  const authorEmail = (isAuthenticated && memberSession ? memberSession.email : body.authorEmail)?.trim();
  const authorMemberId = isAuthenticated && memberSession ? memberSession.memberId : undefined;

  if (!workId || !authorName || !content) {
    return new Response(
      JSON.stringify({ success: false, error: 'Missing required fields: workId, authorName, and content are required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const result = addComment({
    workId,
    parentCommentId: body.parentCommentId || null,
    authorName,
    authorEmail,
    authorMemberId,
    content
  });

  if (!result.success) {
    return new Response(JSON.stringify({ success: false, error: result.error }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (newVisitorCookie) {
    headers.set('Set-Cookie', newVisitorCookie);
  }

  return new Response(
    JSON.stringify({
      success: true,
      comment: result.comment
    }),
    { status: 201, headers }
  );
};
