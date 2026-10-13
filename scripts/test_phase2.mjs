import fs from 'fs';
import path from 'path';
import { exportContent } from './export_content.mjs';
import { restoreContent } from './restore_content.mjs';
import { 
  getAllPublishedWorks, 
  getPublishedWorkBySlug, 
  getAllWorksAdmin, 
  getAllCollections, 
  getCollectionBySlug,
  getCompanionTranslation
} from '../src/lib/content/repository.ts';
import { workSchema } from '../src/lib/content/schema.ts';

async function runPhase2Tests() {
  console.log('================================================================');
  console.log('🧪 Starting Phase 2 Automated Content & Schema Test Suite');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, testName) {
    totalTests++;
    if (condition) {
      console.log(`✓ PASS: ${testName}`);
      passedTests++;
    } else {
      console.error(`✗ FAIL: ${testName}`);
      process.exitCode = 1;
    }
  }

  // --- Test 1: Schema Validation ---
  console.log('▶ Test Category 1: Schema Validation & Typing');
  const allAdminWorks = getAllWorksAdmin();
  assert(allAdminWorks.length === 16, `Total works loaded and validated is 16 (Actual: ${allAdminWorks.length})`);
  
  // Test invalid schema rejection
  const invalidWork = {
    id: "invalid-01",
    title: "", // Empty title should fail
    slug: "Invalid Slug With Spaces", // Bad slug should fail
    contentType: "unknown-type"
  };
  const parseResult = workSchema.safeParse(invalidWork);
  assert(!parseResult.success, 'Schema correctly rejects invalid work record with empty title and malformed slug');

  // --- Test 2: Draft Isolation & Privacy Boundary ---
  console.log('\n▶ Test Category 2: Draft Isolation & Public Privacy Boundary');
  const publishedWorks = getAllPublishedWorks();
  assert(publishedWorks.length === 14, `Public query returns exactly 14 published works (Actual: ${publishedWorks.length})`);

  const draftWorks = allAdminWorks.filter(w => w.status === 'draft');
  assert(draftWorks.length === 2, `Admin query finds exactly 2 draft works (Actual: ${draftWorks.length})`);

  const draftWork1 = getPublishedWorkBySlug('unfinished-nocturne');
  assert(draftWork1 === undefined, 'Draft poem "unfinished-nocturne" is strictly inaccessible via getPublishedWorkBySlug');

  const draftWork2 = getPublishedWorkBySlug('confidential-editorial-notes-upcoming-anthology');
  assert(draftWork2 === undefined, 'Confidential draft essay is strictly inaccessible via getPublishedWorkBySlug');

  const publishedWork = getPublishedWorkBySlug('smritiyon-ki-dehari-par');
  assert(publishedWork !== undefined && publishedWork.title === 'स्मृतियों की देहरी पर', 'Published poem is accessible via getPublishedWorkBySlug');

  // --- Test 3: Relational Integrity (Bilingual Pairs & Collections) ---
  console.log('\n▶ Test Category 3: Relational Integrity & Bilingual Editions');
  const hindiEdition = getPublishedWorkBySlug('samay-ki-nadi');
  const englishEdition = getPublishedWorkBySlug('the-river-of-time');
  assert(hindiEdition !== undefined, 'Hindi edition "समय की नदी" exists');
  assert(englishEdition !== undefined, 'English edition "The River of Time" exists');

  const companionOfHindi = getCompanionTranslation(hindiEdition);
  assert(companionOfHindi?.slug === 'the-river-of-time', 'Hindi edition points reciprocally to English edition');

  const companionOfEnglish = getCompanionTranslation(englishEdition);
  assert(companionOfEnglish?.slug === 'samay-ki-nadi', 'English edition points reciprocally to Hindi edition');

  const collections = getAllCollections();
  assert(collections.length === 2, `Total collections is 2 (Actual: ${collections.length})`);

  const monsoonCol = getCollectionBySlug('monsoon-melancholy');
  assert(monsoonCol !== undefined && monsoonCol.works.length === 3, 'Collection "monsoon-melancholy" resolves exactly 3 published works');

  // --- Test 4: Export & Backup Checksum ---
  console.log('\n▶ Test Category 4: Backup Export & Integrity Checksums');
  const exportResult = await exportContent();
  assert(fs.existsSync(exportResult.backupFilePath), `Backup file was created at ${exportResult.backupFilePath}`);
  assert(exportResult.checksum.length === 64, `SHA-256 Checksum generated successfully (${exportResult.checksum.substring(0, 16)}...)`);
  assert(exportResult.stats.publishedWorks === 14, `Backup contains 14 published works`);
  assert(exportResult.stats.draftWorks === 2, `Backup contains 2 draft works`);

  // --- Test 5: Restore Pipeline Sandbox ---
  console.log('\n▶ Test Category 5: Restore Pipeline Roundtrip Verification');
  const tempRestoreDir = path.join(process.cwd(), 'data/backups/test_restore_sandbox');
  const restoreResult = await restoreContent(exportResult.backupFilePath, tempRestoreDir);
  assert(restoreResult.success === true, 'Restore pipeline succeeded without errors');

  const restoredWorks = JSON.parse(fs.readFileSync(path.join(tempRestoreDir, 'works.json'), 'utf-8'));
  assert(restoredWorks.length === 16, `Restored sandbox contains exactly 16 works (Actual: ${restoredWorks.length})`);

  // Clean up sandbox
  fs.rmSync(tempRestoreDir, { recursive: true, force: true });
  console.log('✓ Cleaned up test restore sandbox');

  // --- Summary ---
  console.log('\n================================================================');
  console.log(`🏁 Phase 2 Test Results: ${passedTests}/${totalTests} Tests Passed`);
  console.log('================================================================');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runPhase2Tests().catch(err => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
