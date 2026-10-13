import type { APIRoute } from 'astro';
import { createLogoutCookie } from '../../../../lib/auth/adminAuth.ts';

export const prerender = false;

export const POST: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      success: true,
      message: 'Logged out successfully.'
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': createLogoutCookie()
      }
    }
  );
};
