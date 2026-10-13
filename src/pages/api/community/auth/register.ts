import type { APIRoute } from 'astro';
import { registerCommunityMember, checkRateLimit } from '../../../../lib/community/communityService.ts';
import { hashPassword, createMemberSessionToken, createMemberCookie } from '../../../../lib/community/memberAuth.ts';

export const prerender = false;

/**
 * POST /api/community/auth/register
 * Registers a new reader/contributor account (Role: community_member)
 */
export const POST: APIRoute = async ({ request }) => {
  const clientIp = request.headers.get('x-forwarded-for') || 'local';

  // Rate limit: max 5 registrations per 10 minutes per IP
  if (!checkRateLimit(`reg_${clientIp}`, 5, 600000)) {
    return new Response(
      JSON.stringify({ success: false, error: 'Registration rate limit reached. Please try again later.' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let body: {
    name?: string;
    email?: string;
    password?: string;
    bio?: string;
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

  // Honeypot check
  if (body.honeypot && body.honeypot.trim().length > 0) {
    return new Response(JSON.stringify({ success: true, message: 'Account registered' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const password = body.password;

  if (!name || name.length < 2) {
    return new Response(JSON.stringify({ success: false, error: 'Name must be at least 2 characters long' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!email || !email.includes('@') || !email.includes('.')) {
    return new Response(JSON.stringify({ success: false, error: 'A valid email address is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!password || password.length < 8) {
    return new Response(JSON.stringify({ success: false, error: 'Password must be at least 8 characters long' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { salt, hash } = hashPassword(password);

  const regResult = registerCommunityMember({
    name,
    email,
    passwordHash: hash,
    passwordSalt: salt,
    bio: body.bio
  });

  if (!regResult.success || !regResult.member) {
    return new Response(JSON.stringify({ success: false, error: regResult.error || 'Registration failed' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Issue member session token
  const token = createMemberSessionToken(regResult.member);
  const cookie = createMemberCookie(token);

  const headers = new Headers({
    'Content-Type': 'application/json',
    'Set-Cookie': cookie
  });

  return new Response(
    JSON.stringify({
      success: true,
      member: {
        id: regResult.member.id,
        name: regResult.member.name,
        email: regResult.member.email,
        role: regResult.member.role,
        isApprovedContributor: regResult.member.isApprovedContributor,
        isApprovedCollaborator: regResult.member.isApprovedCollaborator
      }
    }),
    { status: 201, headers }
  );
};
