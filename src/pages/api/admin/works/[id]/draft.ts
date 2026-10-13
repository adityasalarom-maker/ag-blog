import type { APIRoute } from 'astro';
import { verifyAdminAuth, unauthorizedResponse } from '../../../../../lib/auth/adminAuth.ts';
import { draftWork } from '../../../../../lib/content/adminService.ts';

export const prerender = false;

export const POST: APIRoute = async ({ params, request }) => {
  const auth = verifyAdminAuth(request);
  if (!auth.authorized) {
    return unauthorizedResponse(auth.error);
  }

  const id = params.id as string;
  try {
    const draft = draftWork(id);
    return new Response(
      JSON.stringify({
        success: true,
        message: `Work "${draft.title}" reverted to draft status.`,
        work: draft
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: `Failed to revert to draft: ${(err as Error).message}` }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
