import type { APIRoute } from 'astro';
import { verifyAdminAuth, unauthorizedResponse } from '../../../../lib/auth/adminAuth.ts';
import { restoreBackupArchive } from '../../../../lib/content/adminService.ts';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const auth = verifyAdminAuth(request);
  if (!auth.authorized) {
    return unauthorizedResponse(auth.error);
  }

  try {
    const payload = await request.json();
    const result = restoreBackupArchive(payload);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully restored ${result.restoredCount} works from backup archive.`,
        restoredCount: result.restoredCount
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: `Restore failed: ${(err as Error).message}` }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
