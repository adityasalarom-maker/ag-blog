import type { APIRoute } from 'astro';
import { submitParticipationApplication, checkRateLimit } from '../../../lib/community/communityService.ts';
import { getMemberSessionFromRequest } from '../../../lib/community/memberAuth.ts';

export const prerender = false;

/**
 * POST /api/community/applications
 * Authenticated community member submits application to publish or collaborate
 */
export const POST: APIRoute = async ({ request }) => {
  const session = getMemberSessionFromRequest(request);
  if (!session) {
    return new Response(
      JSON.stringify({ success: false, error: 'Authentication required. Please sign in or register first.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!checkRateLimit(`app_${session.memberId}`, 3, 300000)) {
    return new Response(
      JSON.stringify({ success: false, error: 'Too many application submissions. Please wait.' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let body: {
    intent?: 'publish_work' | 'collaborate' | 'both';
    proposalText?: string;
    creativeBackground?: string;
    sampleLinks?: string[];
  };

  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ success: false, error: 'Malformed JSON payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!body.intent || !body.proposalText) {
    return new Response(
      JSON.stringify({ success: false, error: 'Intent and proposal text are required.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const result = submitParticipationApplication({
    memberId: session.memberId,
    intent: body.intent,
    proposalText: body.proposalText,
    creativeBackground: body.creativeBackground,
    sampleLinks: body.sampleLinks
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
      applicationId: result.application?.id,
      status: result.application?.status,
      message: 'Application submitted successfully. It is now pending review by the site owner.'
    }),
    { status: 201, headers: { 'Content-Type': 'application/json' } }
  );
};
