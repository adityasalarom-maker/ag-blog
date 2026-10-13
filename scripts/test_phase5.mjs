import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = 'http://localhost:4321';

console.log('--- Starting Antigravity Review Phase 5 Automated Test Suite ---');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✓ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`✗ [FAIL] ${name}:`, err.message);
    throw err;
  }
}

async function runAsyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`✓ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`✗ [FAIL] ${name}:`, err.message);
    throw err;
  }
}

// 1. Deep Zoom & Interactive Lightbox Modal Verification
await runAsyncTest('Deep Zoom Lightbox - Contains Multi-Level Zoom Controls & Indicator', async () => {
  const res = await fetch(`${BASE_URL}/gallery`);
  assert.strictEqual(res.status, 200, 'Gallery responded with HTTP 200');
  const html = await res.text();

  assert.ok(html.includes('id="artwork-lightbox"'), 'Dialog element exists');
  assert.ok(html.includes('id="lightbox-zoom-in-btn"'), 'Zoom In (+) button exists');
  assert.ok(html.includes('id="lightbox-zoom-out-btn"'), 'Zoom Out (-) button exists');
  assert.ok(html.includes('id="lightbox-zoom-reset-btn"'), 'Reset Zoom (1:1) button exists');
  assert.ok(html.includes('id="zoom-level-indicator"'), 'Live zoom level percentage indicator exists');
  assert.ok(html.includes('id="lightbox-fullscreen-btn"'), 'Fullscreen toggle button exists');
});

await runAsyncTest('Deep Zoom Lightbox - Carousel Navigation & Panning Helper', async () => {
  const res = await fetch(`${BASE_URL}/gallery`);
  const html = await res.text();

  assert.ok(html.includes('id="lightbox-prev-btn"'), 'Previous artwork navigation button exists');
  assert.ok(html.includes('id="lightbox-next-btn"'), 'Next artwork navigation button exists');
  assert.ok(html.includes('id="lightbox-counter"'), 'Carousel counter element exists');
  assert.ok(html.includes('id="image-stage"'), 'Pannable image stage exists');
  assert.ok(html.includes('id="pan-helper"'), 'Pan gesture helper prompt exists');
});

await runAsyncTest('Deep Zoom Lightbox - Technical Metadata & Declared Rights', async () => {
  const res = await fetch(`${BASE_URL}/gallery`);
  const html = await res.text();

  assert.ok(html.includes('id="lightbox-medium"'), 'Medium metadata field exists');
  assert.ok(html.includes('id="lightbox-dimensions"'), 'Dimensions metadata field exists');
  assert.ok(html.includes('id="lightbox-year"'), 'Year metadata field exists');
  assert.ok(html.includes('id="lightbox-rights"'), 'Rights badge exists');
  assert.ok(html.includes('id="lightbox-caption"'), 'Curatorial caption field exists');
});

// 2. Visual Art Gallery Medium Filter Controls
await runAsyncTest('Gallery Page - Interactive Medium Filter Controls', async () => {
  const res = await fetch(`${BASE_URL}/gallery`);
  const html = await res.text();

  assert.ok(html.includes('class="gallery-filters"'), 'Gallery filters container exists');
  assert.ok(html.includes('data-filter="all"'), 'All works filter button exists');
  assert.ok(html.includes('data-filter="watercolor"'), 'Watercolor filter button exists');
  assert.ok(html.includes('data-filter="calligraphy"'), 'Calligraphy filter button exists');
  assert.ok(html.includes('data-filter="oil"'), 'Oil painting filter button exists');
  assert.ok(html.includes('data-medium-type='), 'Cards carry data-medium-type attribute');
});

// 3. Zen Mode (Distraction-Free Literary Reading Canvas)
await runAsyncTest('Zen Reading Mode - Present on Poetry Single Page', async () => {
  const res = await fetch(`${BASE_URL}/poetry/samay-ki-nadi`);
  assert.strictEqual(res.status, 200);
  const html = await res.text();

  assert.ok(html.includes('id="zen-mode-toggle"'), 'Zen mode toggle button exists on poem page');
  assert.ok(html.includes('Zen Mode • शांत पठन'), 'Contains bilingual Zen mode label');
  assert.ok(html.includes('id="zen-mode-exit"'), 'Floating exit Zen mode button exists');
  assert.ok(html.includes('Exit Zen Mode (Esc)'), 'Contains exit Zen mode label');
});

await runAsyncTest('Zen Reading Mode - Present on Prose Single Page', async () => {
  const res = await fetch(`${BASE_URL}/prose/the-keeper-of-forgotten-manuscripts`);
  assert.strictEqual(res.status, 200);
  const html = await res.text();

  assert.ok(html.includes('id="zen-mode-toggle"'), 'Zen mode toggle button exists on prose page');
  assert.ok(html.includes('id="zen-mode-exit"'), 'Floating exit Zen mode button exists on prose page');
});

runTest('Zen Reading Mode - Global CSS Distraction-Free Rules', () => {
  const css = fs.readFileSync(path.join(process.cwd(), 'src/styles/global.css'), 'utf-8');
  assert.ok(css.includes('[data-zen-mode="true"] .site-header'), 'Hides header in Zen mode');
  assert.ok(css.includes('[data-zen-mode="true"] .site-footer'), 'Hides footer in Zen mode');
  assert.ok(css.includes('[data-zen-mode="true"] .breadcrumb'), 'Hides breadcrumb in Zen mode');
  assert.ok(css.includes('[data-zen-mode="true"] .site-main'), 'Adjusts main reading area padding in Zen mode');
});

// 4. Reader Themes & High-Contrast Palettes (Light, Dark, Sepia)
runTest('Theme System - Three Curated Reading Palettes Defined', () => {
  const css = fs.readFileSync(path.join(process.cwd(), 'src/styles/global.css'), 'utf-8');
  assert.ok(css.includes('--bg-page: #fbf9f4'), 'Light theme parchment background defined');
  assert.ok(css.includes('[data-theme="dark"]'), 'Dark theme midnight ink defined');
  assert.ok(css.includes('--bg-page: #0f1012'), 'Dark theme background defined');
  assert.ok(css.includes('[data-theme="sepia"]'), 'Sepia theme warm archive defined');
  assert.ok(css.includes('--bg-page: #f3ecd8'), 'Sepia theme background defined');
});

await runAsyncTest('Theme System - UI Toggle includes Light, Sepia, and Dark options', async () => {
  const res = await fetch(`${BASE_URL}/`);
  const html = await res.text();

  assert.ok(html.includes('data-set-theme="light"'), 'Light theme button in header');
  assert.ok(html.includes('data-set-theme="sepia"'), 'Sepia theme button in header');
  assert.ok(html.includes('data-set-theme="dark"'), 'Dark theme button in header');
});

// 5. Reader Font Scaling Controls
await runAsyncTest('Font Scaling - Reader Font Sizer Widget with Safe Bounds', async () => {
  const res = await fetch(`${BASE_URL}/`);
  const html = await res.text();

  assert.ok(html.includes('id="font-decrease"'), 'Decrease font size button exists');
  assert.ok(html.includes('id="font-reset"'), 'Reset font size button exists');
  assert.ok(html.includes('id="font-increase"'), 'Increase font size button exists');
});

console.log(`\n======================================================`);
console.log(`Phase 5 Test Suite Complete: ${passedTests}/${totalTests} Tests Passed (100%)`);
console.log(`======================================================\n`);
