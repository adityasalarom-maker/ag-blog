import type { APIRoute } from 'astro';
import { createMemberLogoutCookie, getMemberSessionFromRequest } from '../../../../lib/community/memberAuth.ts';

export const prerender = false;

export const POST: APIRoute = async () => {
  const cookie = createMemberLogoutCookie();
  return new Response(JSON.stringify({ success: true, message: 'Logged out successfully' }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': cookie
    }
  });
};

export const GET: APIRoute = async ({ request }) => {
  const session = getMemberSessionFromRequest(request);
  if (!session) {
    return new Response(JSON.stringify({ success: true, authenticated: false, member: null }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(
    JSON.stringify({
      success: true,
      authenticated: true,
      member: {
        id: session.memberId,
        name: session.name,
        email: session.email,
        role: session.role,
        isApprovedContributor: session.isApprovedContributor,
        isApprovedCollaborator: session.isApprovedCollaborator
      }
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
