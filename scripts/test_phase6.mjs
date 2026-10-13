// scripts/test_phase6.mjs — Comprehensive Phase 6 SEO, Performance, Accessibility & Security Audit
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = 'http://localhost:4321';

// Helper: Calculate relative luminance for sRGB hex color
function getLuminance(hex) {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

// Helper: Calculate contrast ratio between two colors
function getContrastRatio(hex1, hex2) {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Helper: Fetch text
async function fetchText(urlPath, options = {}) {
  const res = await fetch(`${BASE_URL}${urlPath}`, options);
  const text = await res.text();
  return { res, text };
}

// Helper: Extract all matches of regex
function matchAll(regex, text) {
  const matches = [];
  let m;
  while ((m = regex.exec(text)) !== null) {
    matches.push(m);
  }
  return matches;
}

async function runPhase6Audit() {
  console.log('================================================================');
  console.log('🧪 Starting Phase 6 SEO, Accessibility & Security Audit Suite');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  async function test(name, fn) {
    totalTests++;
    try {
      await fn();
      console.log(`✓ [PASS] ${name}`);
      passedTests++;
    } catch (err) {
      console.error(`✗ [FAIL] ${name}: ${err.message}`);
      throw err;
    }
  }

  // -------------------------------------------------------------
  // Test Category 1: WCAG 2.2 AA Contrast Ratios Across 3 Themes
  // -------------------------------------------------------------
  console.log('▶ Test Category 1: WCAG 2.2 AA Color Contrast Audits');

  // Light Theme
  const lightBg = '#fbf9f4';
  const lightPrimary = '#1e1b18';
  const lightSecondary = '#57524a';
  const lightMuted = '#686257';
  const lightCrimson = '#9e2a2b';

  test('WCAG 2.2 AA - Light Theme: Text Primary contrast >= 7:1 (AAA target)', () => {
    const ratio = getContrastRatio(lightPrimary, lightBg);
    assert(ratio >= 7.0, `Expected ratio >= 7.0, got ${ratio.toFixed(2)}`);
  });

  test('WCAG 2.2 AA - Light Theme: Text Secondary contrast >= 4.5:1 (AA target)', () => {
    const ratio = getContrastRatio(lightSecondary, lightBg);
    assert(ratio >= 4.5, `Expected ratio >= 4.5, got ${ratio.toFixed(2)}`);
  });

  test('WCAG 2.2 AA - Light Theme: Text Muted contrast >= 4.5:1 (AA target)', () => {
    const ratio = getContrastRatio(lightMuted, lightBg);
    assert(ratio >= 4.5, `Expected ratio >= 4.5, got ${ratio.toFixed(2)}`);
  });

  test('WCAG 2.2 AA - Light Theme: Accent Crimson contrast >= 4.5:1', () => {
    const ratio = getContrastRatio(lightCrimson, lightBg);
    assert(ratio >= 4.5, `Expected ratio >= 4.5, got ${ratio.toFixed(2)}`);
  });

  // Dark Theme
  const darkBg = '#0f1012';
  const darkPrimary = '#f2efe9';
  const darkSecondary = '#b0aba1';
  const darkMuted = '#969188';

  test('WCAG 2.2 AA - Dark Theme: Text Primary contrast >= 7:1 (AAA target)', () => {
    const ratio = getContrastRatio(darkPrimary, darkBg);
    assert(ratio >= 7.0, `Expected ratio >= 7.0, got ${ratio.toFixed(2)}`);
  });

  test('WCAG 2.2 AA - Dark Theme: Text Secondary contrast >= 4.5:1 (AA target)', () => {
    const ratio = getContrastRatio(darkSecondary, darkBg);
    assert(ratio >= 4.5, `Expected ratio >= 4.5, got ${ratio.toFixed(2)}`);
  });

  test('WCAG 2.2 AA - Dark Theme: Text Muted contrast >= 4.5:1 (AA target)', () => {
    const ratio = getContrastRatio(darkMuted, darkBg);
    assert(ratio >= 4.5, `Expected ratio >= 4.5, got ${ratio.toFixed(2)}`);
  });

  // Sepia Theme
  const sepiaBg = '#f3ecd8';
  const sepiaPrimary = '#33271b';
  const sepiaSecondary = '#63523f';
  const sepiaMuted = '#655644';

  test('WCAG 2.2 AA - Sepia Theme: Text Primary contrast >= 7:1 (AAA target)', () => {
    const ratio = getContrastRatio(sepiaPrimary, sepiaBg);
    assert(ratio >= 7.0, `Expected ratio >= 7.0, got ${ratio.toFixed(2)}`);
  });

  test('WCAG 2.2 AA - Sepia Theme: Text Secondary contrast >= 4.5:1 (AA target)', () => {
    const ratio = getContrastRatio(sepiaSecondary, sepiaBg);
    assert(ratio >= 4.5, `Expected ratio >= 4.5, got ${ratio.toFixed(2)}`);
  });

  test('WCAG 2.2 AA - Sepia Theme: Text Muted contrast >= 4.5:1 (AA target)', () => {
    const ratio = getContrastRatio(sepiaMuted, sepiaBg);
    assert(ratio >= 4.5, `Expected ratio >= 4.5, got ${ratio.toFixed(2)}`);
  });

  // -------------------------------------------------------------
  // Test Category 2: Semantic HTML & Heading Structure Audit
  // -------------------------------------------------------------
  console.log('\n▶ Test Category 2: Heading Hierarchy & Semantic HTML Audit');

  const pagesToTest = [
    { name: 'Homepage', url: '/' },
    { name: 'Poetry Page', url: '/poetry/smritiyon-ki-dehari-par' },
    { name: 'Prose Page', url: '/prose/the-keeper-of-forgotten-manuscripts' },
    { name: 'Gallery Page', url: '/gallery' },
    { name: 'Archive Page', url: '/archive' },
    { name: 'About Page', url: '/about' }
  ];

  for (const page of pagesToTest) {
    const { text } = await fetchText(page.url);
    test(`Heading Structure - ${page.name} contains exactly one <h1> element`, () => {
      const h1Matches = matchAll(/<h1[\s>]/gi, text);
      assert.strictEqual(h1Matches.length, 1, `${page.name} has ${h1Matches.length} <h1> tags; expected exactly 1`);
    });

    test(`Accessibility - ${page.name} contains accessible skip-to-content link`, () => {
      assert(text.includes('class="skip-link"'), `${page.name} missing skip-link`);
      assert(text.includes('href="#main-content"'), `${page.name} skip-link doesn't target #main-content`);
      assert(text.includes('id="main-content"'), `${page.name} missing #main-content anchor`);
    });
  }

  // -------------------------------------------------------------
  // Test Category 3: Structured Data (JSON-LD Schema.org) Audit
  // -------------------------------------------------------------
  console.log('\n▶ Test Category 3: JSON-LD Schema.org Structured Data Audit');

  // Homepage: WebSite & Periodical
  const { text: homeHtml } = await fetchText('/');
  test('Structured Data - Homepage contains valid JSON-LD WebSite & Periodical schema', () => {
    const scriptMatch = homeHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    assert(scriptMatch, 'Homepage missing application/ld+json script');
    const parsed = JSON.parse(scriptMatch[1]);
    assert(Array.isArray(parsed), 'Expected array of schemas on homepage');
    const webSite = parsed.find(s => s['@type'] === 'WebSite');
    assert(webSite, 'Missing WebSite schema');
    assert.strictEqual(webSite.name, 'Antigravity Review');
    assert(webSite.potentialAction, 'Missing SearchAction potentialAction');

    const periodical = parsed.find(s => s['@type'] === 'Periodical');
    assert(periodical, 'Missing Periodical schema');
    assert.strictEqual(periodical.editor.name, 'A. G. Varma');
  });

  // Poetry: CreativeWork/Article & BreadcrumbList
  const { text: poemHtml } = await fetchText('/poetry/smritiyon-ki-dehari-par');
  test('Structured Data - Poetry page contains valid CreativeWork & BreadcrumbList schema', () => {
    const scriptMatch = poemHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    assert(scriptMatch, 'Poem page missing application/ld+json script');
    const parsed = JSON.parse(scriptMatch[1]);
    assert(Array.isArray(parsed), 'Expected array of schemas on poetry page');
    const article = parsed.find(s => Array.isArray(s['@type']) ? s['@type'].includes('CreativeWork') : s['@type'] === 'Article');
    assert(article, 'Missing CreativeWork/Article schema');
    assert.strictEqual(article.headline, 'स्मृतियों की देहरी पर');
    assert(article.author.name === 'A. G. Varma' || article.author.name === 'ए. जी. वर्मा', `Unexpected author name: ${article.author.name}`);

    const breadcrumbs = parsed.find(s => s['@type'] === 'BreadcrumbList');
    assert(breadcrumbs, 'Missing BreadcrumbList schema');
    assert.strictEqual(breadcrumbs.itemListElement.length, 3);
  });

  // Prose: Article & BreadcrumbList
  const { text: proseHtml } = await fetchText('/prose/the-keeper-of-forgotten-manuscripts');
  test('Structured Data - Prose page contains valid Article & BreadcrumbList schema', () => {
    const scriptMatch = proseHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    assert(scriptMatch, 'Prose page missing application/ld+json script');
    const parsed = JSON.parse(scriptMatch[1]);
    const article = parsed.find(s => s['@type'] === 'Article');
    assert(article, 'Missing Article schema');
    assert.strictEqual(article.headline, 'The Keeper of Forgotten Manuscripts');

    const breadcrumbs = parsed.find(s => s['@type'] === 'BreadcrumbList');
    assert(breadcrumbs, 'Missing BreadcrumbList schema');
  });

  // Gallery: VisualArtwork & BreadcrumbList
  const { text: galleryHtml } = await fetchText('/gallery');
  test('Structured Data - Gallery page contains VisualArtwork schemas & BreadcrumbList', () => {
    const scriptMatch = galleryHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    assert(scriptMatch, 'Gallery page missing application/ld+json script');
    const parsed = JSON.parse(scriptMatch[1]);
    const artworks = parsed.filter(s => s['@type'] === 'VisualArtwork');
    assert(artworks.length > 0, 'Missing VisualArtwork schemas');
    assert(artworks.some(a => a.name.includes('Twilight')), 'Missing Twilight artwork');

    const breadcrumbs = parsed.find(s => s['@type'] === 'BreadcrumbList');
    assert(breadcrumbs, 'Missing BreadcrumbList schema');
  });

  // -------------------------------------------------------------
  // Test Category 4: Sitemap XML & Robots.txt Directives
  // -------------------------------------------------------------
  console.log('\n▶ Test Category 4: Sitemap XML & Robots.txt Directives');

  // Robots.txt
  const { res: robotsRes, text: robotsText } = await fetchText('/robots.txt');
  test('Robots.txt - Returns HTTP 200 with proper User-agent and Disallow rules', () => {
    assert.strictEqual(robotsRes.status, 200);
    assert(robotsText.includes('User-agent: *'), 'Missing User-agent');
    assert(robotsText.includes('Disallow: /admin/'), 'Missing Disallow: /admin/');
    assert(robotsText.includes('Disallow: /api/admin/'), 'Missing Disallow: /api/admin/');
    assert(robotsText.includes('Sitemap: https://ag-literary-publication.pages.dev/sitemap.xml'), 'Missing Sitemap directive');
  });

  // Sitemap.xml
  const { res: sitemapRes, text: sitemapXml } = await fetchText('/sitemap.xml');
  test('Sitemap.xml - Returns HTTP 200 with application/xml header and valid XML structure', () => {
    assert.strictEqual(sitemapRes.status, 200);
    const contentType = sitemapRes.headers.get('content-type') || '';
    assert(contentType.includes('application/xml') || contentType.includes('text/xml'), `Expected xml content-type, got ${contentType}`);
    assert(sitemapXml.includes('<urlset'), 'Missing <urlset> root element');
    assert(sitemapXml.includes('</urlset>'), 'Missing </urlset> closing tag');
  });

  test('Sitemap.xml - Includes all primary public published works & collections', () => {
    assert(sitemapXml.includes('/poetry/smritiyon-ki-dehari-par'), 'Missing published poem');
    assert(sitemapXml.includes('/prose/the-keeper-of-forgotten-manuscripts'), 'Missing published prose');
    assert(sitemapXml.includes('/collections/monsoon-melancholy'), 'Missing published collection');
  });

  test('Sitemap.xml - Includes reciprocal bilingual xhtml:link hreflang tags', () => {
    assert(sitemapXml.includes('xhtml:link rel="alternate" hreflang="hi"'), 'Missing Hindi alternate tag');
    assert(sitemapXml.includes('xhtml:link rel="alternate" hreflang="en"'), 'Missing English alternate tag');
  });

  test('Sitemap.xml - Strict Zero Draft & Admin Leakage in Sitemap', () => {
    assert(!sitemapXml.includes('unfinished-nocturne'), 'Draft poem leaked into sitemap');
    assert(!sitemapXml.includes('the-unwritten-treatise-on-shadows'), 'Draft essay leaked into sitemap');
    assert(!sitemapXml.includes('/admin'), 'Admin path leaked into sitemap');
    assert(!sitemapXml.includes('/api/'), 'API path leaked into sitemap');
  });

  // -------------------------------------------------------------
  // Test Category 5: Security Headers & OWASP Web Protections
  // -------------------------------------------------------------
  console.log('\n▶ Test Category 5: Security Headers & OWASP Protections');

  const { res: secRes } = await fetchText('/api/search.json');
  test('Security Headers - X-Content-Type-Options is nosniff', () => {
    assert.strictEqual(secRes.headers.get('x-content-type-options'), 'nosniff');
  });

  test('Security Headers - X-Frame-Options is SAMEORIGIN', () => {
    assert.strictEqual(secRes.headers.get('x-frame-options'), 'SAMEORIGIN');
  });

  test('Security Headers - Referrer-Policy is strict-origin-when-cross-origin', () => {
    assert.strictEqual(secRes.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
  });

  test('Security Headers - Permissions-Policy restricts sensitive device APIs', () => {
    const policy = secRes.headers.get('permissions-policy');
    assert(policy, 'Missing Permissions-Policy');
    assert(policy.includes('camera=()'), 'Camera not disabled');
    assert(policy.includes('microphone=()'), 'Microphone not disabled');
  });

  test('Security Headers - Content-Security-Policy enforces trusted origins', () => {
    const csp = secRes.headers.get('content-security-policy');
    assert(csp, 'Missing Content-Security-Policy');
    assert(csp.includes("default-src 'self'"), 'CSP missing default-src');
    assert(csp.includes('https://fonts.googleapis.com'), 'CSP missing Google Fonts');
    assert(csp.includes('https://fonts.gstatic.com'), 'CSP missing Google Static Fonts');
  });

  test('Security Headers - Cloudflare Pages public/_headers rules exist and match policy', () => {
    const headersContent = fs.readFileSync(path.join(process.cwd(), 'public', '_headers'), 'utf8');
    assert(headersContent.includes('X-Content-Type-Options: nosniff'), 'Missing nosniff in _headers');
    assert(headersContent.includes('X-Frame-Options: SAMEORIGIN'), 'Missing SAMEORIGIN in _headers');
    assert(headersContent.includes('Referrer-Policy: strict-origin-when-cross-origin'), 'Missing referrer policy in _headers');
    assert(headersContent.includes('Permissions-Policy:'), 'Missing permissions policy in _headers');
    assert(headersContent.includes('Content-Security-Policy:'), 'Missing CSP in _headers');
  });

  // Admin Route Unauthorized Protection
  await test('Access Control - Unauthenticated request to /admin redirects or rejects safely', async () => {
    const res = await fetch(`${BASE_URL}/admin`, { redirect: 'manual' });
    // Should be redirect to login (302) or unauthorized (401/403)
    assert([302, 401, 403].includes(res.status), `Expected 302/401/403, got ${res.status}`);
  });

  await test('Access Control - Unauthenticated POST to /api/admin/works rejects with 401 Unauthorized', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/works`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Unauthorized Test' })
    });
    assert.strictEqual(res.status, 401);
  });

  // Zero Draft Leakage & Internal Notes Sanitization in Public API
  await test('Privacy Isolation - Search API returns 0 drafts and 0 private notes', async () => {
    const { text: searchRaw } = await fetchText('/api/search.json');
    const searchData = JSON.parse(searchRaw);
    const items = searchData.results || searchData;
    assert(Array.isArray(items), 'Search API did not return array');
    
    // Check no drafts
    const drafts = items.filter(w => w.status && w.status !== 'published');
    assert.strictEqual(drafts.length, 0, `Search API leaked ${drafts.length} non-published works`);

    // Check no internalNotes or privateEvidenceRef
    for (const work of items) {
      assert.strictEqual(work.internalNotes, undefined, `Leaked internalNotes in work ${work.slug}`);
      if (work.rights) {
        assert.strictEqual(work.rights.privateEvidenceRef, undefined, `Leaked privateEvidenceRef in work ${work.slug}`);
      }
    }
  });

  // -------------------------------------------------------------
  // Test Category 6: Content Export & Restore Verification
  // -------------------------------------------------------------
  console.log('\n▶ Test Category 6: Backup Archive & Restore Roundtrip');

  await test('Backup Pipeline - Content backup export script verifies SHA-256 integrity', async () => {
    const { exportContent } = await import('./export_content.mjs');
    const { backupFilePath, checksum, stats } = await exportContent();
    assert(fs.existsSync(backupFilePath), 'Backup file was not created');
    
    const data = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));
    assert(data.checksum, 'Missing SHA-256 checksum');
    assert.strictEqual(data.checksum, checksum, 'Checksum mismatch in export bundle');
    assert.strictEqual(data.data.works.length, 16);
    assert.strictEqual(data.data.collections.length, 2);

    // Clean up test backup file
    fs.unlinkSync(backupFilePath);
  });

  console.log('\n================================================================');
  console.log(`🏁 Phase 6 Audit Complete: ${passedTests}/${totalTests} Tests Passed (100%)`);
  console.log('================================================================');
}

runPhase6Audit().catch(err => {
  console.error('\n❌ Phase 6 Audit Failed:', err);
  process.exit(1);
});
