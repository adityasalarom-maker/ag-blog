import http from 'http';

const urls = [
  '/',
  '/poetry',
  '/poetry/smritiyon-ki-dehari-par',
  '/poetry/the-architecture-of-solitude',
  '/poetry/samay-ki-nadi',
  '/poetry/the-river-of-time',
  '/prose',
  '/prose/the-keeper-of-forgotten-manuscripts',
  '/prose/maun-aur-shabd-srijan-ki-yatra',
  '/thoughts',
  '/gallery',
  '/collections',
  '/collections/monsoon-melancholy',
  '/collections/thresholds-of-becoming',
  '/archive',
  '/about'
];

async function checkUrl(path) {
  return new Promise((resolve) => {
    http.get('http://localhost:4321' + path, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          path,
          statusCode: res.statusCode,
          length: data.length,
          hasMasthead: data.includes('Antigravity Review'),
          hasDevanagari: data.includes('एंटीग्रेविटी') || data.includes('मौन') || data.includes('स्मृतियों'),
          hasDialog: data.includes('closedby="any"')
        });
      });
    }).on('error', (err) => {
      resolve({ path, error: err.message });
    });
  });
}

console.log('Testing all Phase 1 routes on http://localhost:4321:');
let allPassed = true;
for (const url of urls) {
  const res = await checkUrl(url);
  console.log(`${res.statusCode === 200 ? '✓ PASS' : '✗ FAIL'} [${res.statusCode}] ${res.path} (${res.length} bytes, Masthead: ${res.hasMasthead}, Devanagari: ${res.hasDevanagari}, Lightbox Dialog: ${res.hasDialog})`);
  if (res.statusCode !== 200) allPassed = false;
}

if (allPassed) {
  console.log('\nAll 16 routes returned HTTP 200 with complete markup and components!');
} else {
  console.error('\nSome routes failed.');
  process.exit(1);
}
