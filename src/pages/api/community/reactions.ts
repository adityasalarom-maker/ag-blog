import type { APIRoute } from 'astro';
import { getWorkReactionsSummary, toggleWorkReaction, checkRateLimit } from '../../../lib/community/communityService.ts';
import { getParticipantId } from '../../../lib/community/memberAuth.ts';

export const prerender = false;

/**
 * GET /api/community/reactions?workId=...
 * Returns current counts and whether the current visitor/user has reacted.
 */
export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const workId = url.searchParams.get('workId');

  if (!workId) {
    return new Response(JSON.stringify({ success: false, error: 'workId query parameter is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { participantId, newVisitorCookie } = getParticipantId(request);
  const summary = getWorkReactionsSummary(workId, participantId);

  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (newVisitorCookie) {
    headers.set('Set-Cookie', newVisitorCookie);
  }

  return new Response(
    JSON.stringify({
      success: true,
      data: summary
    }),
    { status: 200, headers }
  );
};

/**
 * POST /api/community/reactions
 * Toggles Like or Inspired reaction for a published work.
 */
export const POST: APIRoute = async ({ request }) => {
  const { participantId, newVisitorCookie } = getParticipantId(request);

  // Rate limit: max 20 reaction toggles per minute per participant
  if (!checkRateLimit(`rxn_${participantId}`, 20, 60000)) {
    return new Response(
      JSON.stringify({ success: false, error: 'Rate limit exceeded. Please wait a moment.' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let body: { workId?: string; reactionType?: 'like' | 'inspired' };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ success: false, error: 'Malformed JSON payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { workId, reactionType } = body;
  if (!workId || !reactionType || (reactionType !== 'like' && reactionType !== 'inspired')) {
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid parameters: workId and reactionType (like|inspired) are required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const result = toggleWorkReaction(workId, reactionType, participantId);

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
      active: result.active,
      data: result.summary
    }),
    { status: 200, headers }
  );
};
