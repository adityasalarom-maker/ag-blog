import type { APIRoute } from 'astro';
import { verifyAdminAuth, unauthorizedResponse } from '../../../../lib/auth/adminAuth.ts';
import {
  moderateComment,
  getAllCommentsAdmin,
  getApplicationsAdmin,
  reviewParticipationApplication,
  getAllQueriesAdmin,
  getSubmissionsAdmin
} from '../../../../lib/community/communityService.ts';

export const prerender = false;

/**
 * GET /api/admin/community/moderate?type=comments|applications|queries|submissions
 */
export const GET: APIRoute = async ({ request }) => {
  const auth = verifyAdminAuth(request);
  if (!auth.authorized) {
    return unauthorizedResponse(auth.error);
  }

  const url = new URL(request.url);
  const type = url.searchParams.get('type') || 'all';

  if (type === 'comments') {
    return new Response(JSON.stringify({ success: true, comments: getAllCommentsAdmin() }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (type === 'applications') {
    return new Response(JSON.stringify({ success: true, applications: getApplicationsAdmin() }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (type === 'queries') {
    return new Response(JSON.stringify({ success: true, queries: getAllQueriesAdmin() }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (type === 'submissions') {
    return new Response(JSON.stringify({ success: true, submissions: getSubmissionsAdmin() }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(
    JSON.stringify({
      success: true,
      comments: getAllCommentsAdmin(),
      applications: getApplicationsAdmin(),
      queries: getAllQueriesAdmin(),
      submissions: getSubmissionsAdmin()
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};

/**
 * POST /api/admin/community/moderate
 * Owner actions:
 * - moderate_comment: { target: 'comment', id, action: 'approve' | 'hide' | 'flag' | 'delete' }
 * - review_application: { target: 'application', id, decision: 'approved' | 'rejected' | 'additional_info_requested', feedback }
 */
export const POST: APIRoute = async ({ request }) => {
  const auth = verifyAdminAuth(request);
  if (!auth.authorized) {
    return unauthorizedResponse(auth.error);
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ success: false, error: 'Malformed JSON payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (body.target === 'comment') {
    const { id, action } = body;
    if (!id || !action) {
      return new Response(JSON.stringify({ success: false, error: 'id and action are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    const result = moderateComment(id, action);
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (body.target === 'application') {
    const { id, decision, feedback } = body;
    if (!id || !decision) {
      return new Response(JSON.stringify({ success: false, error: 'id and decision are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    const result = reviewParticipationApplication(id, decision, feedback);
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ success: false, error: 'Invalid moderation target' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' }
  });
};
