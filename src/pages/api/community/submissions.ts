import type { APIRoute } from 'astro';
import { submitContributorWork, checkRateLimit } from '../../../lib/community/communityService.ts';
import { getMemberSessionFromRequest } from '../../../lib/community/memberAuth.ts';

export const prerender = false;

/**
 * POST /api/community/submissions
 * Authenticated approved contributor submits a creative draft for editorial review
 */
export const POST: APIRoute = async ({ request }) => {
  const session = getMemberSessionFromRequest(request);
  if (!session) {
    return new Response(
      JSON.stringify({ success: false, error: 'Authentication required. Please sign in.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!session.isApprovedContributor) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Forbidden: You must be an approved contributor to submit works. Please submit a contributor application first.'
      }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!checkRateLimit(`sub_${session.memberId}`, 5, 300000)) {
    return new Response(
      JSON.stringify({ success: false, error: 'Submission rate limit reached. Please wait.' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
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

  if (!body.title || !body.contentType || !body.excerpt || !body.body || !body.rightsDeclaration) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Missing required fields: title, contentType, excerpt, body, and rightsDeclaration are required'
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const result = submitContributorWork({
    contributorId: session.memberId,
    title: body.title,
    contentType: body.contentType,
    language: body.language || 'en',
    script: body.script || 'Latn',
    excerpt: body.excerpt,
    body: body.body,
    coverImage: body.coverImage,
    tags: body.tags || [],
    rightsDeclaration: body.rightsDeclaration
  });

  if (!result.success) {
    return new Response(JSON.stringify({ success: false, error: result.error }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(
    JSON.stringify({
      success: true,
      submissionId: result.submission?.id,
      status: result.submission?.status,
      message: 'Creative work draft submitted successfully for editorial review.'
    }),
    { status: 201, headers: { 'Content-Type': 'application/json' } }
  );
};
