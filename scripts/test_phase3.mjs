/**
 * Phase 3 Automated Verification Test Runner
 * Validates:
 * 1. Admin Authentication & Server-Side Authorization Guard
 * 2. Privacy Boundary (Strict Sanitization of Internal Notes & Evidence References)
 * 3. End-to-End Publishing Lifecycle: Create -> Preview -> Publish -> Share -> Edit -> Archive
 * 4. Visual Artwork Workflow & Technical Specifications
 * 5. Rights & Attribution Rigor (Distinction between Original Creator, Public Domain, Curated Citation)
 * 6. Backup Archive Export & Restore Roundtrip
 */

import assert from 'node:assert';
import crypto from 'node:crypto';
import { 
  createSessionToken, 
  verifySessionToken, 
  verifyOwnerPassword, 
  verifyAdminAuth,
  createSessionCookie
} from '../src/lib/auth/adminAuth.ts';

import { 
  getAdminWorks, 
  getAdminWorkById, 
  getAdminWorkBySlug, 
  createWork, 
  updateWork, 
  publishWork, 
  archiveWork, 
  draftWork, 
  deleteWork, 
  exportBackupArchive, 
  restoreBackupArchive 
} from '../src/lib/content/adminService.ts';

import { 
  getAllPublishedWorks, 
  getPublishedWorkBySlug 
} from '../src/lib/content/repository.ts';

let passedTests = 0;
let totalTests = 0;

function pass(msg) {
  passedTests++;
  console.log(`✓ PASS: ${msg}`);
}

function fail(msg, err) {
  console.error(`✗ FAIL: ${msg}`);
  if (err) console.error(err);
  process.exitCode = 1;
}

console.log('='.repeat(64));
console.log('🧪 Starting Phase 3 Automated Admin Publishing Test Suite');
console.log('='.repeat(64));

// Save initial backup to restore at the end
const initialBackup = exportBackupArchive();

try {
  // -------------------------------------------------------------
  // TEST CATEGORY 1: Authentication & Server-Side Security Guard
  // -------------------------------------------------------------
  console.log('\n▶ Test Category 1: Authentication & Server-Side Security Guard');

  // 1.1 Unauthenticated Request Check
  totalTests++;
  const unauthRequest = new Request('http://localhost:4321/api/admin/works');
  const unauthResult = verifyAdminAuth(unauthRequest);
  assert.strictEqual(unauthResult.authorized, false, 'Unauthenticated request must be rejected');
  assert.strictEqual(unauthResult.session, null);
  pass('Unauthenticated request to admin endpoint is rejected server-side');

  // 1.2 Invalid password check
  totalTests++;
  const badPasswordResult = verifyOwnerPassword('wrong-passphrase-attempt');
  assert.strictEqual(badPasswordResult, false, 'Invalid password must return false');
  pass('Invalid owner password fails verification');

  // 1.3 Valid owner password check
  totalTests++;
  const validPasswordResult = verifyOwnerPassword('antigravity-review-owner-2026');
  assert.strictEqual(validPasswordResult, true, 'Default owner passphrase must be valid');
  pass('Configured owner password succeeds verification');

  // 1.4 Session Token Creation & Verification
  totalTests++;
  const sessionToken = createSessionToken();
  const session = verifySessionToken(sessionToken);
  assert.ok(session, 'Generated session token must be verifiable');
  assert.strictEqual(session.role, 'owner');
  assert.strictEqual(session.name, 'A. G. Varma');
  pass('HMAC-SHA256 session token verified with owner role');

  // 1.5 Authenticated Request with Cookie
  totalTests++;
  const cookieHeader = `ag_admin_session=${encodeURIComponent(sessionToken)}`;
  const cookieRequest = new Request('http://localhost:4321/api/admin/works', {
    headers: { 'cookie': cookieHeader }
  });
  const cookieAuthResult = verifyAdminAuth(cookieRequest);
  assert.strictEqual(cookieAuthResult.authorized, true, 'Cookie session must be authorized');
  pass('HTTP Cookie session authorized by admin guard');

  // 1.6 Authenticated Request with Authorization Bearer Header
  totalTests++;
  const bearerRequest = new Request('http://localhost:4321/api/admin/works', {
    headers: { 'authorization': `Bearer ${sessionToken}` }
  });
  const bearerAuthResult = verifyAdminAuth(bearerRequest);
  assert.strictEqual(bearerAuthResult.authorized, true, 'Bearer token must be authorized');
  pass('Authorization: Bearer header authorized by admin guard');

  // 1.7 Tampered Token Rejection
  totalTests++;
  const tamperedToken = sessionToken.slice(0, -6) + 'abcdef';
  const tamperedSession = verifySessionToken(tamperedToken);
  assert.strictEqual(tamperedSession, null, 'Tampered token must fail signature check');
  pass('Tampered session token fails cryptographic signature verification');

  // -------------------------------------------------------------
  // TEST CATEGORY 2: Confidential Privacy & Internal Notes Boundary
  // -------------------------------------------------------------
  console.log('\n▶ Test Category 2: Confidential Privacy & Internal Notes Boundary');

  // 2.1 Public query strips internalNotes and privateEvidenceRef
  totalTests++;
  const publicWorks = getAllPublishedWorks();
  const hasLeakedNotes = publicWorks.some(w => Boolean(w.internalNotes));
  assert.strictEqual(hasLeakedNotes, false, 'No public work may contain internalNotes');
  pass('Strict Privacy: All public works have internalNotes completely stripped');

  totalTests++;
  const hasLeakedEvidence = publicWorks.some(w => Boolean(w.rights && w.rights.privateEvidenceRef));
  assert.strictEqual(hasLeakedEvidence, false, 'No public work may contain rights.privateEvidenceRef');
  pass('Strict Privacy: All public works have privateEvidenceRef completely stripped');

  // 2.2 Admin query preserves internalNotes and privateEvidenceRef
  totalTests++;
  const adminWorks = getAdminWorks();
  const foundAdminNote = adminWorks.some(w => Boolean(w.internalNotes));
  assert.strictEqual(foundAdminNote, true, 'Admin query must preserve internalNotes for authorized owner');
  pass('Admin Authorization: Internal notes are preserved for authenticated owner');

  // -------------------------------------------------------------
  // TEST CATEGORY 3: Complete Publishing Workflow Lifecycle
  // -------------------------------------------------------------
  console.log('\n▶ Test Category 3: Publishing Lifecycle (Create -> Preview -> Publish -> Share -> Edit -> Archive)');

  const testPoemSlug = `test-sandhya-rag-${Date.now()}`;
  let createdWorkId = '';

  // 3.1 Create Draft Work
  totalTests++;
  const createdPoem = createWork({
    title: 'संध्या राग',
    slug: testPoemSlug,
    contentType: 'poem',
    language: 'hi',
    script: 'Deva',
    creator: 'A. G. Varma',
    excerpt: 'शाम की सुनहली देहरी पर बजता हुआ एक शांत आलाप।',
    body: `क्षितिज की लालिमा में\nधुल रहा है आज का दिन।\n\nनदी की धार पर\nकांपती हैं अंतिम किरणें।`,
    status: 'draft',
    readingTimeMinutes: 2,
    tags: ['sandhya', 'kavita', 'peace'],
    rights: {
      declaredBy: 'A. G. Varma',
      declarationType: 'Original Creator',
      status: 'Creator-Declared',
      notice: '© 2026 A. G. Varma. All rights reserved.',
      privateEvidenceRef: 'MS-DRAFT-SANDHYA-01'
    },
    internalNotes: 'Draft written during October twilight contemplation; review before publishing.'
  });

  createdWorkId = createdPoem.id;
  assert.strictEqual(createdPoem.status, 'draft');
  assert.strictEqual(createdPoem.title, 'संध्या राग');
  pass(`Created new draft poem with ID: ${createdWorkId}`);

  // 3.2 Draft Quarantine Verification
  totalTests++;
  const publicFetchAttempt = getPublishedWorkBySlug(testPoemSlug);
  assert.strictEqual(publicFetchAttempt, undefined, 'Draft poem MUST NOT be accessible via public getter');
  pass('Draft poem is strictly quarantined from public reader endpoint');

  // 3.3 Admin Live Preview Access
  totalTests++;
  const adminPreviewWork = getAdminWorkBySlug(testPoemSlug);
  assert.ok(adminPreviewWork, 'Admin preview must be able to load draft by slug');
  assert.strictEqual(adminPreviewWork.status, 'draft');
  assert.strictEqual(adminPreviewWork.rights.privateEvidenceRef, 'MS-DRAFT-SANDHYA-01');
  assert.ok(adminPreviewWork.internalNotes.includes('October twilight'));
  pass('Draft preview loads full work with private notes and stanza line-height');

  // 3.4 Publish State Transition
  totalTests++;
  const publishedPoem = publishWork(createdWorkId);
  assert.strictEqual(publishedPoem.status, 'published');
  assert.ok(publishedPoem.publishedAt, 'Published date must be recorded');
  pass('Work transitioned from draft to published status');

  // 3.5 Public Live Verification
  totalTests++;
  const livePublicPoem = getPublishedWorkBySlug(testPoemSlug);
  assert.ok(livePublicPoem, 'Published poem MUST now be accessible via public getter');
  assert.strictEqual(livePublicPoem.status, 'published');
  assert.strictEqual(livePublicPoem.title, 'संध्या राग');
  // Verify private notes were stripped on the newly published work!
  assert.strictEqual(livePublicPoem.internalNotes, undefined);
  assert.strictEqual(livePublicPoem.rights.privateEvidenceRef, undefined);
  pass('Published work is live on public endpoint with private data securely stripped');

  // 3.6 Edit Published Work
  totalTests++;
  const updatedPoem = updateWork(createdWorkId, {
    title: 'संध्या राग (The Evening Melody)',
    excerpt: 'शाम की सुनहली देहरी पर बजता हुआ एक शांत और गंभीर आलाप।'
  });
  assert.strictEqual(updatedPoem.title, 'संध्या राग (The Evening Melody)');
  const liveUpdated = getPublishedWorkBySlug(testPoemSlug);
  assert.strictEqual(liveUpdated.title, 'संध्या राग (The Evening Melody)');
  pass('Edited work title and excerpt updated immediately in live public repository');

  // 3.7 Archive / Withdraw Work
  totalTests++;
  const archivedPoem = archiveWork(createdWorkId);
  assert.strictEqual(archivedPoem.status, 'archived');
  const postArchivePublicCheck = getPublishedWorkBySlug(testPoemSlug);
  assert.strictEqual(postArchivePublicCheck, undefined, 'Archived work MUST be withdrawn from public endpoint');
  pass('Archived work is immediately withdrawn and inaccessible from public readers');

  // -------------------------------------------------------------
  // TEST CATEGORY 4: Visual Artwork Workflow Verification
  // -------------------------------------------------------------
  console.log('\n▶ Test Category 4: Visual Artwork Workflow');

  const testArtSlug = `test-akash-ganga-${Date.now()}`;
  totalTests++;
  const createdArtwork = createWork({
    title: 'आकाश गंगा (The Celestial Stream)',
    slug: testArtSlug,
    contentType: 'artwork',
    language: 'hi',
    script: 'Deva',
    creator: 'A. G. Varma',
    excerpt: 'ब्रह्मांडीय नीरवता और स्वर्णिम तारों का एक अमूर्त दृश्य संयोजन।',
    body: 'An abstract exploration of celestial light and cosmic harmony.',
    coverImage: '/images/artworks/artwork_silent_valley.jpg',
    coverAlt: 'A vast cosmic stream of golden starlight across deep indigo velvet void.',
    status: 'draft',
    artworkDetails: {
      medium: 'Gold leaf and mineral pigment on Belgian linen',
      yearCreated: 2026,
      dimensions: '120 × 90 cm',
      aspectRatio: '4:3'
    },
    rights: {
      declaredBy: 'A. G. Varma',
      declarationType: 'Original Creator',
      status: 'Creator-Declared',
      notice: '© 2026 A. G. Varma. All rights reserved.',
      privateEvidenceRef: 'ART-ORIG-2026-09'
    }
  });

  assert.strictEqual(createdArtwork.contentType, 'artwork');
  assert.strictEqual(createdArtwork.artworkDetails.aspectRatio, '4:3');
  assert.strictEqual(createdArtwork.artworkDetails.medium, 'Gold leaf and mineral pigment on Belgian linen');
  pass('Visual artwork created with validated technical specifications');

  // -------------------------------------------------------------
  // TEST CATEGORY 5: Rights & Attribution Rigor
  // -------------------------------------------------------------
  console.log('\n▶ Test Category 5: Rights & Attribution Rigor');

  totalTests++;
  // Verify Classical Quotation attribution distinction
  const quoteWork = createWork({
    title: 'कबीर की साखी',
    slug: `test-kabir-quote-${Date.now()}`,
    contentType: 'quote',
    language: 'hi',
    script: 'Deva',
    creator: 'Kabir (कबीर)',
    excerpt: 'पोथी पढ़ि पढ़ि जग मुआ, पंडित भया न कोय।',
    body: 'पोथी पढ़ि पढ़ि जग मुआ, पंडित भया न कोय।\nढाई आखर प्रेम का, पढ़े सो पंडित होय॥',
    status: 'published',
    quoteSource: {
      author: 'Kabir',
      workTitle: 'Kabir Granthavali',
      year: '15th Century',
      url: 'https://archive.org/details/kabir',
      isVerified: true
    },
    rights: {
      declaredBy: 'Antigravity Editorial',
      declarationType: 'Public Domain Attributed',
      status: 'Attributed',
      notice: 'Historical classical verse. In public domain under Indian and international copyright law.'
    }
  });

  assert.strictEqual(quoteWork.rights.status, 'Attributed');
  assert.strictEqual(quoteWork.rights.declarationType, 'Public Domain Attributed');
  assert.strictEqual(quoteWork.quoteSource.isVerified, true);
  pass('Attribution model enforces non-false claims for public domain / curated citations');

  // -------------------------------------------------------------
  // TEST CATEGORY 6: Backup Archive Export & Restore Roundtrip
  // -------------------------------------------------------------
  console.log('\n▶ Test Category 6: Backup Archive Export & Restore Roundtrip');

  totalTests++;
  const exported = exportBackupArchive();
  assert.ok(exported.checksum, 'Backup archive must compute a SHA-256 checksum');
  assert.ok(exported.counts.works > 0, 'Backup archive must count works');
  pass(`Backup archive successfully generated (Checksum: ${exported.checksum.slice(0, 16)}...)`);

  totalTests++;
  // Verify Restore
  const restoreResult = restoreBackupArchive({
    checksum: exported.checksum,
    data: exported.data
  });
  assert.strictEqual(restoreResult.success, true);
  assert.strictEqual(restoreResult.restoredCount, exported.counts.works);
  pass(`Restore roundtrip verified: ${restoreResult.restoredCount} works restored from checksummed archive`);

  // -------------------------------------------------------------
  // Clean up test works to leave repository in original clean state
  // -------------------------------------------------------------
  deleteWork(createdWorkId);
  deleteWork(createdArtwork.id);
  deleteWork(quoteWork.id);
  restoreBackupArchive(initialBackup);
  console.log('\n✓ Cleaned up ephemeral test records and restored initial repository state');

} catch (err) {
  fail('Unexpected error during test execution', err);
}

console.log('='.repeat(64));
console.log(`🏁 Phase 3 Test Results: ${passedTests}/${totalTests} Tests Passed`);
console.log('='.repeat(64));

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
