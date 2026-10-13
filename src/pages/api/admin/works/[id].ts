import type { APIRoute } from 'astro';
import { verifyAdminAuth, unauthorizedResponse } from '../../../../lib/auth/adminAuth.ts';
import { getAdminWorkById, updateWork, deleteWork } from '../../../../lib/content/adminService.ts';

export const prerender = false;

export const GET: APIRoute = async ({ params, request }) => {
  const auth = verifyAdminAuth(request);
  if (!auth.authorized) {
    return unauthorizedResponse(auth.error);
  }

  const id = params.id as string;
  const work = getAdminWorkById(id);

  if (!work) {
    return new Response(
      JSON.stringify({ success: false, error: `Work with ID "${id}" not found.` }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ success: true, work }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};

export const PUT: APIRoute = async ({ params, request }) => {
  const auth = verifyAdminAuth(request);
  if (!auth.authorized) {
    return unauthorizedResponse(auth.error);
  }

  const id = params.id as string;
  try {
    const payload = await request.json();
    const updated = updateWork(id, payload);

    return new Response(
      JSON.stringify({ success: true, work: updated }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: `Update failed: ${(err as Error).message}` }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const DELETE: APIRoute = async ({ params, request }) => {
  const auth = verifyAdminAuth(request);
  if (!auth.authorized) {
    return unauthorizedResponse(auth.error);
  }

  const id = params.id as string;
  const deleted = deleteWork(id);

  if (!deleted) {
    return new Response(
      JSON.stringify({ success: false, error: `Work with ID "${id}" not found.` }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ success: true, message: `Work "${id}" deleted permanently.` }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
