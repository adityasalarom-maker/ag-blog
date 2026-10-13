import type { APIRoute } from 'astro';
import { createMemberLogoutCookie } from '../../../../lib/community/memberAuth.ts';

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
