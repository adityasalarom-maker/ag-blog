import type { APIRoute } from 'astro';
import { verifyAdminAuth, unauthorizedResponse } from '../../../../../lib/auth/adminAuth.ts';
import { archiveWork } from '../../../../../lib/content/adminService.ts';

export const prerender = false;

export const POST: APIRoute = async ({ params, request }) => {
  const auth = verifyAdminAuth(request);
  if (!auth.authorized) {
    return unauthorizedResponse(auth.error);
  }

  const id = params.id as string;
  try {
    const archived = archiveWork(id);
    return new Response(
      JSON.stringify({
        success: true,
        message: `Work "${archived.title}" is archived and withdrawn from public view.`,
        work: archived
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: `Archiving failed: ${(err as Error).message}` }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
