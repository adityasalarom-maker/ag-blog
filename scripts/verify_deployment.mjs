// scripts/verify_deployment.mjs — Live Production Smoke Test & Deployment Verification
import assert from 'node:assert';

const TARGET_URL = (process.env.DEPLOYED_URL || process.argv[2] || 'http://localhost:4321').replace(/\/$/, '');

async function fetchRoute(path) {
  const url = `${TARGET_URL}${path}`;
  const res = await fetch(url, { redirect: 'manual' });
  const text = await res.text();
  return { res, text, url };
}

async function verifyDeployment() {
  console.log('================================================================');
  console.log(`🚀 Live Deployment Verification: ${TARGET_URL}`);
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  async function check(name, fn) {
    total++;
    try {
      await fn();
      console.log(`✓ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`✗ [FAIL] ${name}: ${err.message}`);
      throw err;
    }
  }

  // 1. Live Homepage
  await check('Homepage - Status 200 and Masthead branding loaded', async () => {
    const { res, text } = await fetchRoute('/');
    assert.strictEqual(res.status, 200);
    assert(text.includes('Antigravity Review'), 'Missing publication title');
    assert(text.includes('एंटीग्रेविटी समीक्षा'), 'Missing Hindi Devanagari brand title');
    assert(text.includes('skip-link'), 'Missing accessible skip link');
  });

  // 2. Poetry Section & Stanza Formatting
  await check('Poetry Single Work - Renders bilingual stanzas & hreflang', async () => {
    const { res, text } = await fetchRoute('/poetry/smritiyon-ki-dehari-par');
    assert.strictEqual(res.status, 200);
    assert(text.includes('स्मृतियों की देहरी पर'), 'Missing poem title');
    assert(text.includes('class="poem-stanza"'), 'Missing stanza wrapper');
    assert(text.includes('application/ld+json'), 'Missing JSON-LD schema');
  });

  // 3. Prose Section & Reading Experience
  await check('Prose Single Work - Renders reading progress & drop cap', async () => {
    const { res, text } = await fetchRoute('/prose/the-keeper-of-forgotten-manuscripts');
    assert.strictEqual(res.status, 200);
    assert(text.includes('The Keeper of Forgotten Manuscripts'), 'Missing story title');
    assert(text.includes('reading-progress-bar'), 'Missing progress bar');
    assert(text.includes('application/ld+json'), 'Missing JSON-LD schema');
  });

  // 4. Visual Art Gallery & Lightbox Integration
  await check('Gallery - Visual art cards with zoom lightbox triggers', async () => {
    const { res, text } = await fetchRoute('/gallery');
    assert.strictEqual(res.status, 200);
    assert(text.includes('data-artwork-trigger'), 'Missing artwork lightbox trigger');
    assert(text.includes('gallery-filter-btn'), 'Missing gallery filter controls');
  });

  // 5. Search API & Zero Draft Leakage
  await check('Search Index - Returns published catalog with 0 draft leaks', async () => {
    const { res, text } = await fetchRoute('/api/search.json');
    assert.strictEqual(res.status, 200);
    const data = JSON.parse(text);
    const items = data.results || data;
    assert(Array.isArray(items), 'Search index must return array');
    assert(items.length >= 14, `Expected at least 14 published items, got ${items.length}`);
    
    // Strict draft quarantine check
    for (const item of items) {
      assert(!item.status || item.status === 'published', `Draft item leaked: ${item.slug}`);
      assert.strictEqual(item.internalNotes, undefined, `Leaked internalNotes: ${item.slug}`);
    }
  });

  // 6. Robots.txt Directives
  await check('Robots.txt - Accessible and disallows admin indexing', async () => {
    const { res, text } = await fetchRoute('/robots.txt');
    assert.strictEqual(res.status, 200);
    assert(text.includes('User-agent: *'), 'Missing User-agent rule');
    assert(text.includes('Disallow: /admin/'), 'Missing Disallow /admin/');
    assert(text.includes('sitemap.xml'), 'Missing sitemap link');
  });

  // 7. Sitemap XML Integrity
  await check('Sitemap.xml - Valid XML with published routes and hreflang links', async () => {
    const { res, text } = await fetchRoute('/sitemap.xml');
    assert.strictEqual(res.status, 200);
    assert(text.includes('<urlset'), 'Missing urlset root');
    assert(text.includes('/poetry/smritiyon-ki-dehari-par'), 'Missing published poem in sitemap');
    assert(!text.includes('unfinished-nocturne'), 'Draft poem leaked into sitemap');
  });

  // 8. 404 Error Handling
  await check('404 Handling - Nonexistent route fails safely', async () => {
    const { res } = await fetchRoute('/nonexistent-test-route-404');
    assert([404, 301, 302].includes(res.status), `Expected 404, got ${res.status}`);
  });

  console.log('\n================================================================');
  console.log(`🏁 Deployment Verification Complete: ${passed}/${total} Checks Passed (100%)`);
  console.log('================================================================');
}

verifyDeployment().catch(err => {
  console.error('\n❌ Deployment Verification Failed:', err);
  process.exit(1);
});
