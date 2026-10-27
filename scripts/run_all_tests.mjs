// scripts/run_all_tests.mjs — Comprehensive regression runner
import { spawnSync } from 'node:child_process';

const testScripts = [
  'scripts/test_phase2.mjs',
  'scripts/test_phase3.mjs',
  'scripts/test_phase4.mjs',
  'scripts/test_phase5.mjs',
  'scripts/test_phase6.mjs',
  'scripts/test_community_features.mjs'
];

console.log('================================================================');
console.log('🧪 Running Antigravity Review Full Regression Test Suite');
console.log('================================================================\n');

let allPassed = true;
for (const script of testScripts) {
  console.log(`\n▶ Executing: node ${script}`);
  const result = spawnSync('node', [script], { stdio: 'inherit' });
  if (result.status !== 0) {
    allPassed = false;
    console.error(`\n❌ Failed: ${script} (Exit Code: ${result.status})`);
    process.exit(result.status || 1);
  }
}

if (allPassed) {
  console.log('\n================================================================');
  console.log('✅ ALL TEST SUITES PASSED CLEANLY (100%)');
  console.log('================================================================\n');
}
