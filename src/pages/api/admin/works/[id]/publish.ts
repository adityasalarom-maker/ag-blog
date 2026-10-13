import type { APIRoute } from 'astro';
import { verifyAdminAuth, unauthorizedResponse } from '../../../../../lib/auth/adminAuth.ts';
import { publishWork } from '../../../../../lib/content/adminService.ts';

export const prerender = false;

export const POST: APIRoute = async ({ params, request }) => {
  const auth = verifyAdminAuth(request);
  if (!auth.authorized) {
    return unauthorizedResponse(auth.error);
  }

  const id = params.id as string;
  try {
    const published = publishWork(id);
    return new Response(
      JSON.stringify({
        success: true,
        message: `Work "${published.title}" is now published on the public site.`,
        work: published
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: `Publishing failed: ${(err as Error).message}` }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
