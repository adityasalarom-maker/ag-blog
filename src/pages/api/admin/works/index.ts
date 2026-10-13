import type { APIRoute } from 'astro';
import { verifyAdminAuth, unauthorizedResponse } from '../../../../lib/auth/adminAuth.ts';
import { getAdminWorks, createWork } from '../../../../lib/content/adminService.ts';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const auth = verifyAdminAuth(request);
  if (!auth.authorized) {
    return unauthorizedResponse(auth.error);
  }

  const url = new URL(request.url);
  const status = url.searchParams.get('status') || undefined;
  const contentType = url.searchParams.get('contentType') || undefined;
  const search = url.searchParams.get('search') || undefined;

  const works = getAdminWorks({ status, contentType, search });

  return new Response(
    JSON.stringify({
      success: true,
      count: works.length,
      works
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
};

export const POST: APIRoute = async ({ request }) => {
  const auth = verifyAdminAuth(request);
  if (!auth.authorized) {
    return unauthorizedResponse(auth.error);
  }

  try {
    const payload = await request.json();
    const created = createWork(payload);

    return new Response(
      JSON.stringify({
        success: true,
        work: created
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        success: false,
        error: `Failed to create work: ${(err as Error).message}`
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
