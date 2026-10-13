import type { APIRoute } from 'astro';
import { verifyAdminAuth, unauthorizedResponse } from '../../../../lib/auth/adminAuth.ts';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const auth = verifyAdminAuth(request);
  if (!auth.authorized) {
    return unauthorizedResponse(auth.error);
  }

  return new Response(
    JSON.stringify({
      success: true,
      authenticated: true,
      user: auth.session
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
};
