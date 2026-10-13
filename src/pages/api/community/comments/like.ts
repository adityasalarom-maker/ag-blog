import type { APIRoute } from 'astro';
import { toggleCommentLike, checkRateLimit } from '../../../../lib/community/communityService.ts';
import { getParticipantId } from '../../../../lib/community/memberAuth.ts';

export const prerender = false;

/**
 * POST /api/community/comments/like
 * Toggles like on a specific comment (1 per user per comment)
 */
export const POST: APIRoute = async ({ request }) => {
  const { participantId, newVisitorCookie } = getParticipantId(request);

  if (!checkRateLimit(`clike_${participantId}`, 30, 60000)) {
    return new Response(
      JSON.stringify({ success: false, error: 'Too many requests. Please wait.' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let body: { commentId?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ success: false, error: 'Malformed JSON payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const commentId = body.commentId?.trim();
  if (!commentId) {
    return new Response(JSON.stringify({ success: false, error: 'commentId is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const result = toggleCommentLike(commentId, participantId);
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
      likeCount: result.likeCount
    }),
    { status: 200, headers }
  );
};
