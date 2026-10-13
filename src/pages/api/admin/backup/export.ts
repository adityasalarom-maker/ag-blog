import type { APIRoute } from 'astro';
import { verifyAdminAuth, unauthorizedResponse } from '../../../../lib/auth/adminAuth.ts';
import { exportBackupArchive } from '../../../../lib/content/adminService.ts';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const auth = verifyAdminAuth(request);
  if (!auth.authorized) {
    return unauthorizedResponse(auth.error);
  }

  const backup = exportBackupArchive();

  return new Response(
    JSON.stringify({
      success: true,
      backup
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="antigravity_backup_${Date.now()}.json"`
      }
    }
  );
};

export const POST: APIRoute = GET;
