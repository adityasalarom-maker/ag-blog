import type { APIRoute } from 'astro';
import { getMemberByEmail, checkRateLimit } from '../../../../lib/community/communityService.ts';
import { verifyPassword, createMemberSessionToken, createMemberCookie } from '../../../../lib/community/memberAuth.ts';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const clientIp = request.headers.get('x-forwarded-for') || 'local';

  // Rate limit: max 10 login attempts per 5 minutes per IP
  if (!checkRateLimit(`log_${clientIp}`, 10, 300000)) {
    return new Response(
      JSON.stringify({ success: false, error: 'Too many login attempts. Please wait a few minutes.' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ success: false, error: 'Malformed JSON payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password;

  if (!email || !password) {
    return new Response(JSON.stringify({ success: false, error: 'Email and password are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const member = getMemberByEmail(email);
  if (!member || !verifyPassword(password, member.passwordSalt, member.passwordHash)) {
    return new Response(JSON.stringify({ success: false, error: 'Invalid email or password' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const token = createMemberSessionToken(member);
  const cookie = createMemberCookie(token);

  const headers = new Headers({
    'Content-Type': 'application/json',
    'Set-Cookie': cookie
  });

  return new Response(
    JSON.stringify({
      success: true,
      member: {
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.role,
        isApprovedContributor: member.isApprovedContributor,
        isApprovedCollaborator: member.isApprovedCollaborator
      }
    }),
    { status: 200, headers }
  );
};
