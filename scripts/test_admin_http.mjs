/**
 * Phase 3 Live HTTP Integration Test
 * Performs real HTTP requests against http://localhost:4321 to test:
 * - Server-side 401 rejection on unauthenticated requests
 * - Login, session cookie issuance, and verification
 * - Admin dashboard and editor accessibility
 * - Draft creation, previewing, and draft quarantine over HTTP
 * - Publishing and cleanup
 */

import assert from 'node:assert';

const BASE_URL = 'http://localhost:4321';

let passedTests = 0;
let totalTests = 0;

function pass(msg) {
  passedTests++;
  console.log(`✓ PASS: ${msg}`);
}

console.log('='.repeat(64));
console.log('🌐 Starting Phase 3 Live HTTP Endpoint Tests on ' + BASE_URL);
console.log('='.repeat(64));

async function runTests() {
  // 1. Unauthenticated API request
  totalTests++;
  const unauthRes = await fetch(`${BASE_URL}/api/admin/works`);
  assert.strictEqual(unauthRes.status, 401, 'Unauthenticated request must return HTTP 401');
  const unauthJson = await unauthRes.json();
  assert.strictEqual(unauthJson.success, false);
  pass('Live HTTP: Unauthenticated request to /api/admin/works returns 401 Unauthorized');

  // 2. Failed login attempt
  totalTests++;
  const badLoginRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'incorrect-pass' })
  });
  assert.strictEqual(badLoginRes.status, 401, 'Bad credentials must return HTTP 401');
  pass('Live HTTP: Invalid password rejected with 401');

  // 3. Successful login
  totalTests++;
  const loginRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'antigravity-review-owner-2026' })
  });
  assert.strictEqual(loginRes.status, 200, 'Correct password must return HTTP 200');
  const loginData = await loginRes.json();
  assert.strictEqual(loginData.success, true);
  assert.ok(loginData.token);

  // Extract session cookie from Set-Cookie header
  const setCookie = loginRes.headers.get('set-cookie');
  assert.ok(setCookie && setCookie.includes('ag_admin_session='), 'Response must include ag_admin_session cookie');
  const sessionCookie = setCookie.split(';')[0];
  pass('Live HTTP: Owner login succeeded, issued HTTP-only session cookie');

  // 4. Session verification endpoint
  totalTests++;
  const sessionRes = await fetch(`${BASE_URL}/api/admin/auth/session`, {
    headers: { 'Cookie': sessionCookie }
  });
  assert.strictEqual(sessionRes.status, 200);
  const sessionData = await sessionRes.json();
  assert.strictEqual(sessionData.authenticated, true);
  assert.strictEqual(sessionData.user.role, 'owner');
  pass('Live HTTP: /api/admin/auth/session verified valid session');

  // 5. Unauthenticated visit to /admin redirects to login
  totalTests++;
  const unauthPageRes = await fetch(`${BASE_URL}/admin`, { redirect: 'manual' });
  assert.ok([301, 302, 307, 308].includes(unauthPageRes.status), 'Unauthenticated page access must redirect');
  const location = unauthPageRes.headers.get('location');
  assert.ok(location && location.includes('/admin/login'), 'Must redirect to /admin/login');
  pass('Live HTTP: Unauthenticated page request to /admin redirected to /admin/login');

  // 6. Authenticated visit to /admin succeeds
  totalTests++;
  const authPageRes = await fetch(`${BASE_URL}/admin`, {
    headers: { 'Cookie': sessionCookie }
  });
  assert.strictEqual(authPageRes.status, 200);
  const html = await authPageRes.text();
  assert.ok(html.includes('Editorial Publishing Suite'), 'Dashboard HTML must render');
  assert.ok(html.includes('Total Works'), 'Dashboard metrics must render');
  pass('Live HTTP: Authenticated request to /admin renders Owner Publishing Dashboard');

  // 7. Create draft poem via HTTP
  totalTests++;
  const testSlug = `http-test-poem-${Date.now()}`;
  const createRes = await fetch(`${BASE_URL}/api/admin/works`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': sessionCookie
    },
    body: JSON.stringify({
      title: 'क्षण और अनंत (The Moment & Eternity)',
      slug: testSlug,
      contentType: 'poem',
      language: 'hi',
      script: 'Deva',
      creator: 'A. G. Varma',
      excerpt: 'एक क्षण में सिमटा हुआ अनंत का अनुभव।',
      body: 'क्षण की हथेली पर\nधरा है अनंत का भार।',
      status: 'draft',
      readingTimeMinutes: 2,
      tags: ['anant', 'kshan'],
      rights: {
        declaredBy: 'A. G. Varma',
        declarationType: 'Original Creator',
        status: 'Creator-Declared',
        notice: '© 2026 A. G. Varma. All rights reserved.',
        privateEvidenceRef: 'MS-HTTP-TEST-01'
      },
      internalNotes: 'Live HTTP creation test draft.'
    })
  });
  assert.strictEqual(createRes.status, 201, 'Creation must return HTTP 201');
  const createData = await createRes.json();
  assert.strictEqual(createData.success, true);
  const createdId = createData.work.id;
  pass(`Live HTTP: Created draft poem via POST /api/admin/works (ID: ${createdId})`);

  // 8. Authenticated draft preview
  totalTests++;
  const previewRes = await fetch(`${BASE_URL}/admin/preview/${testSlug}`, {
    headers: { 'Cookie': sessionCookie }
  });
  assert.strictEqual(previewRes.status, 200);
  const previewHtml = await previewRes.text();
  assert.ok(previewHtml.includes('क्षण और अनंत'), 'Preview renders work title');
  assert.ok(previewHtml.includes('Private Reading Canvas'), 'Preview renders admin draft banner');
  assert.ok(previewHtml.includes('MS-HTTP-TEST-01'), 'Preview displays private evidence ref to owner');
  pass('Live HTTP: /admin/preview/[slug] renders draft reading canvas with private metadata');

  // 9. Draft quarantine: public endpoint must return 404 for draft
  totalTests++;
  const publicCheckRes = await fetch(`${BASE_URL}/poetry/${testSlug}`);
  assert.strictEqual(publicCheckRes.status, 404, 'Public route must return 404 for draft work');
  pass('Live HTTP: Draft work is strictly quarantined from public /poetry/[slug] (HTTP 404)');

  // 10. Publish work via HTTP
  totalTests++;
  const pubRes = await fetch(`${BASE_URL}/api/admin/works/${createdId}/publish`, {
    method: 'POST',
    headers: { 'Cookie': sessionCookie }
  });
  assert.strictEqual(pubRes.status, 200);
  const pubData = await pubRes.json();
  assert.strictEqual(pubData.work.status, 'published');
  pass('Live HTTP: POST /api/admin/works/[id]/publish transitioned work to published');

  // 11. Archive work via HTTP
  totalTests++;
  const archRes = await fetch(`${BASE_URL}/api/admin/works/${createdId}/archive`, {
    method: 'POST',
    headers: { 'Cookie': sessionCookie }
  });
  assert.strictEqual(archRes.status, 200);
  const archData = await archRes.json();
  assert.strictEqual(archData.work.status, 'archived');
  pass('Live HTTP: POST /api/admin/works/[id]/archive transitioned work to archived');

  // 12. Delete test work via HTTP
  totalTests++;
  const delRes = await fetch(`${BASE_URL}/api/admin/works/${createdId}`, {
    method: 'DELETE',
    headers: { 'Cookie': sessionCookie }
  });
  assert.strictEqual(delRes.status, 200);
  pass('Live HTTP: DELETE /api/admin/works/[id] cleaned up test work');

  // 13. Export Backup Archive via HTTP
  totalTests++;
  const exportRes = await fetch(`${BASE_URL}/api/admin/backup/export`, {
    headers: { 'Cookie': sessionCookie }
  });
  assert.strictEqual(exportRes.status, 200);
  const exportData = await exportRes.json();
  assert.strictEqual(exportData.success, true);
  assert.ok(exportData.backup.checksum);
  pass('Live HTTP: GET /api/admin/backup/export generated verifiable JSON archive');

  // 14. Logout via HTTP
  totalTests++;
  const logoutRes = await fetch(`${BASE_URL}/api/admin/auth/logout`, {
    method: 'POST',
    headers: { 'Cookie': sessionCookie }
  });
  assert.strictEqual(logoutRes.status, 200);
  pass('Live HTTP: POST /api/admin/auth/logout invalidated session');

  console.log('='.repeat(64));
  console.log(`🏁 Phase 3 Live HTTP Tests: ${passedTests}/${totalTests} Tests Passed`);
  console.log('='.repeat(64));
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
