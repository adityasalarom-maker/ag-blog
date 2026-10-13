import type { APIRoute } from 'astro';
import { verifyOwnerPassword, createSessionToken, createSessionCookie } from '../../../../lib/auth/adminAuth.ts';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password || !verifyOwnerPassword(password)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid password. Access restricted to publication owner.'
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const token = createSessionToken();
    const cookieHeader = createSessionCookie(token);

    return new Response(
      JSON.stringify({
        success: true,
        user: { role: 'owner', name: 'A. G. Varma' },
        token
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': cookieHeader
        }
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        success: false,
        error: `Login processing error: ${(err as Error).message}`
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
