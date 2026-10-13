import assert from 'node:assert';

const BASE_URL = process.env.BASE_URL || 'http://localhost:4321';
let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`✓ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`✗ [FAIL] ${name}:`, err.message);
    failed++;
  }
}

async function request(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
  const res = await fetch(url, options);
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {}
  return { res, text, json };
}

console.log('================================================================');
console.log('🧪 Community & Reader Engagement Automated Test Suite');
console.log('================================================================');

// -----------------------------------------------------------------------------
// Category 1: Feature A — Like & Inspired Work Reactions
// -----------------------------------------------------------------------------
console.log('\n▶ Test Category 1: Like & Inspired Reactions');

let visitorCookie = '';
const testWorkId = 'poem-hi-01'; // smritiyon-ki-dehari-par

await test('Reactions - GET returns initial summary with separate like and inspired counts', async () => {
  const { res, json } = await request(`/api/community/reactions?workId=${testWorkId}`);
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.success, true);
  assert.ok(typeof json.data.likeCount === 'number');
  assert.ok(typeof json.data.inspiredCount === 'number');
  assert.strictEqual(json.data.workId, testWorkId);

  // Capture visitor session cookie
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) {
    visitorCookie = setCookie.split(';')[0];
  }
});

await test('Reactions - POST toggles Like reaction ON', async () => {
  const { res, json } = await request('/api/community/reactions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(visitorCookie ? { 'Cookie': visitorCookie } : {})
    },
    body: JSON.stringify({ workId: testWorkId, reactionType: 'like' })
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.success, true);
  assert.strictEqual(json.active, true);
  assert.strictEqual(json.data.userLiked, true);
  assert.ok(json.data.likeCount >= 1);
});

await test('Reactions - POST toggles Inspired reaction ON separately', async () => {
  const { res, json } = await request('/api/community/reactions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(visitorCookie ? { 'Cookie': visitorCookie } : {})
    },
    body: JSON.stringify({ workId: testWorkId, reactionType: 'inspired' })
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.success, true);
  assert.strictEqual(json.active, true);
  assert.strictEqual(json.data.userInspired, true);
  assert.ok(json.data.inspiredCount >= 1);
});

await test('Reactions - Duplicate voting prevention: re-submitting Like toggles it OFF', async () => {
  const { res, json } = await request('/api/community/reactions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(visitorCookie ? { 'Cookie': visitorCookie } : {})
    },
    body: JSON.stringify({ workId: testWorkId, reactionType: 'like' })
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.success, true);
  assert.strictEqual(json.active, false, 'Second vote removes the reaction');
  assert.strictEqual(json.data.userLiked, false);
});

await test('Reactions - Rejects reactions on unpublished draft work', async () => {
  const { res, json } = await request('/api/community/reactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workId: 'work-poem-draft-001', reactionType: 'like' })
  });

  assert.strictEqual(res.status, 400);
  assert.strictEqual(json.success, false);
  assert.ok(json.error.includes('unpublished'));
});

// -----------------------------------------------------------------------------
// Category 2: Feature B — Comments, Threaded Replies & Comment Likes
// -----------------------------------------------------------------------------
console.log('\n▶ Test Category 2: Comments & Threaded Discussion');

let createdCommentId = '';

await test('Comments - Successfully submits new top-level reflection', async () => {
  const { res, json } = await request('/api/community/comments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(visitorCookie ? { 'Cookie': visitorCookie } : {})
    },
    body: JSON.stringify({
      workId: testWorkId,
      authorName: 'Aarav Sharma',
      authorEmail: 'aarav@example.com',
      content: 'A deeply contemplative poem. The rhythm between silence and memory resonates powerfully.'
    })
  });

  assert.strictEqual(res.status, 201);
  assert.strictEqual(json.success, true);
  assert.ok(json.comment.id.startsWith('cmt_'));
  assert.strictEqual(json.comment.authorName, 'Aarav Sharma');
  assert.strictEqual(json.comment.parentCommentId, null);
  createdCommentId = json.comment.id;
});

await test('Comments - Successfully submits 1-level threaded reply', async () => {
  assert.ok(createdCommentId, 'Parent comment exists');
  const { res, json } = await request('/api/community/comments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(visitorCookie ? { 'Cookie': visitorCookie } : {})
    },
    body: JSON.stringify({
      workId: testWorkId,
      parentCommentId: createdCommentId,
      authorName: 'Priya Verma',
      content: 'I agree completely, especially the second stanza in Devanagari.'
    })
  });

  assert.strictEqual(res.status, 201);
  assert.strictEqual(json.success, true);
  assert.strictEqual(json.comment.parentCommentId, createdCommentId);
});

await test('Comments - GET /api/community/comments returns discussions with nested replies', async () => {
  const { res, json } = await request(`/api/community/comments?workId=${testWorkId}`);
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.success, true);
  assert.ok(json.data.totalComments >= 2);

  const foundParent = json.data.comments.find(c => c.id === createdCommentId);
  assert.ok(foundParent, 'Found created parent comment');
  assert.ok(foundParent.replies && foundParent.replies.length >= 1, 'Replies array populated');
  assert.strictEqual(foundParent.replies[0].authorName, 'Priya Verma');
});

await test('Comments - HTML sanitization protects against script injection', async () => {
  const { res, json } = await request('/api/community/comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workId: testWorkId,
      authorName: '<script>alert("xss")</script>Hacker',
      content: 'Hello <img src=x onerror=alert(1)> and <b>bold</b>'
    })
  });

  assert.strictEqual(res.status, 201);
  assert.strictEqual(json.comment.authorName.includes('<script>'), false);
  assert.strictEqual(json.comment.authorName.includes('&lt;script&gt;'), true);
  assert.strictEqual(json.comment.content.includes('<img'), false);
});

await test('Comments - Toggles Like on comment (1 like per user)', async () => {
  assert.ok(createdCommentId);
  const { res, json } = await request('/api/community/comments/like', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(visitorCookie ? { 'Cookie': visitorCookie } : {})
    },
    body: JSON.stringify({ commentId: createdCommentId })
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.success, true);
  assert.strictEqual(json.active, true);
  assert.ok(json.likeCount >= 1);
});

// -----------------------------------------------------------------------------
// Category 3: Feature C — Private Author Query System & Identifiable Email Delivery
// -----------------------------------------------------------------------------
console.log('\n▶ Test Category 3: Private Author Queries & Email Delivery');

let queryId = '';

await test('Queries - Submits valid inquiry and generates formatted subject', async () => {
  const { res, json } = await request('/api/community/queries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      senderName: 'Prof. Alok Nath',
      senderEmail: 'alok.nath@university.edu',
      category: 'copyright_permission',
      subject: 'Permission to cite poem in academic anthology',
      message: 'Respected author, I wish to include your poem "The Architecture of Solitude" in our upcoming comparative literature anthology.',
      sourceWorkSlug: 'the-architecture-of-solitude',
      sourceWorkTitle: 'The Architecture of Solitude',
      consentPrivacy: true
    })
  });

  assert.strictEqual(res.status, 201);
  assert.strictEqual(json.success, true);
  assert.ok(json.queryId.startsWith('QRY-'));
  queryId = json.queryId;

  // Verify identifiable subject pattern: [WEBSITE QUERY] [CATEGORY] — [SUBJECT]
  assert.ok(json.emailSubject.startsWith('[WEBSITE QUERY] [COPYRIGHT & PERMISSION] — '));
  assert.ok(json.emailSubject.includes('Permission to cite poem'));
});

await test('Queries - Rejects query without privacy consent', async () => {
  const { res, json } = await request('/api/community/queries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      senderName: 'Test Sender',
      senderEmail: 'test@example.com',
      category: 'general',
      subject: 'Inquiry',
      message: 'Test message here...',
      consentPrivacy: false
    })
  });

  assert.strictEqual(res.status, 400);
  assert.strictEqual(json.success, false);
});

await test('Queries - Honeypot silently drops spam bots', async () => {
  const { res, json } = await request('/api/community/queries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      senderName: 'Spam Bot',
      senderEmail: 'spambot@spam.com',
      category: 'general',
      subject: 'Buy cheap watches',
      message: 'Spam content...',
      consentPrivacy: true,
      honeypot: 'http://spamlink.com'
    })
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.queryId, 'QRY-BOT-DROPPED');
});

// -----------------------------------------------------------------------------
// Category 4: Feature D — Community Registration & Participation
// -----------------------------------------------------------------------------
console.log('\n▶ Test Category 4: Community Registration & Participation');

const testEmail = `writer_${Date.now()}@literaryclub.org`;
let memberCookie = '';
let memberId = '';

await test('Community - Registers new community member with community_member role', async () => {
  const { res, json } = await request('/api/community/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Kavita Iyer',
      email: testEmail,
      password: 'StrongSecretPassword2026!',
      bio: 'Bilingual poet exploring contemporary verse and Devanagari translation.'
    })
  });

  assert.strictEqual(res.status, 201);
  assert.strictEqual(json.success, true);
  assert.strictEqual(json.member.role, 'community_member');
  assert.strictEqual(json.member.isApprovedContributor, false);
  memberId = json.member.id;

  const setCookie = res.headers.get('set-cookie');
  assert.ok(setCookie);
  memberCookie = setCookie.split(';')[0];
});

await test('Community - Rejects duplicate registration with same email', async () => {
  const { res, json } = await request('/api/community/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Duplicate Kavita',
      email: testEmail,
      password: 'AnotherPassword2026!'
    })
  });

  assert.strictEqual(res.status, 400);
  assert.strictEqual(json.success, false);
  assert.ok(json.error.includes('already exists'));
});

await test('Community - GET /api/community/auth/me returns authenticated member session', async () => {
  const { res, json } = await request('/api/community/auth/me', {
    headers: { 'Cookie': memberCookie }
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.authenticated, true);
  assert.strictEqual(json.member.email, testEmail);
  assert.strictEqual(json.member.role, 'community_member');
});

let applicationId = '';

await test('Community - Authenticated member submits publishing proposal', async () => {
  const { res, json } = await request('/api/community/applications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': memberCookie
    },
    body: JSON.stringify({
      intent: 'publish_work',
      proposalText: 'I would like to propose a suite of 5 Hindi poems exploring urban loneliness and classical Sanskrit metaphors.',
      creativeBackground: 'Published in Sahitya quarterly, 2024.'
    })
  });

  assert.strictEqual(res.status, 201);
  assert.strictEqual(json.success, true);
  assert.strictEqual(json.status, 'pending');
  assert.ok(json.applicationId.startsWith('app_'));
  applicationId = json.applicationId;
});

await test('Community - Unapproved member cannot directly submit draft work', async () => {
  const { res, json } = await request('/api/community/submissions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': memberCookie
    },
    body: JSON.stringify({
      title: 'Premature Poem',
      contentType: 'poem',
      language: 'hi',
      script: 'Deva',
      excerpt: 'Short excerpt...',
      body: 'Stanza 1...',
      rightsDeclaration: 'I declare originality'
    })
  });

  assert.strictEqual(res.status, 403, 'Forbidden: Not yet an approved contributor');
  assert.strictEqual(json.success, false);
});

// -----------------------------------------------------------------------------
// Category 5: Owner Moderation & Contributor Promotion
// -----------------------------------------------------------------------------
console.log('\n▶ Test Category 5: Owner Moderation & Contributor Promotion');

// Login as owner to obtain admin session
const ownerPassword = 'antigravity-review-owner-2026';
let adminCookie = '';

await test('Admin - Owner signs in to get administrative session', async () => {
  const { res, json } = await request('/api/admin/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: ownerPassword })
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.success, true);
  const setCookie = res.headers.get('set-cookie');
  assert.ok(setCookie);
  adminCookie = setCookie.split(';')[0];
});

await test('Admin - Owner inspects queries queue', async () => {
  const { res, json } = await request('/api/admin/community/moderate?type=queries', {
    headers: { 'Cookie': adminCookie }
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.success, true);
  assert.ok(Array.isArray(json.queries));
  const found = json.queries.find(q => q.id === queryId);
  assert.ok(found, 'Found created reader inquiry in admin queue');
});

await test('Admin - Owner approves participation application, promoting member to contributor', async () => {
  assert.ok(applicationId);
  const { res, json } = await request('/api/admin/community/moderate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': adminCookie
    },
    body: JSON.stringify({
      target: 'application',
      id: applicationId,
      decision: 'approved',
      feedback: 'Welcome to Antigravity Review. You are approved to submit poem drafts.'
    })
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.success, true);
});

await test('Community - Re-authenticating member now has isApprovedContributor = true', async () => {
  // Re-login as the approved member to refresh session permissions
  const { res, json } = await request('/api/community/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: 'StrongSecretPassword2026!' })
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.member.isApprovedContributor, true);

  const setCookie = res.headers.get('set-cookie');
  memberCookie = setCookie.split(';')[0];
});

await test('Community - Approved contributor can now submit draft work for editorial review', async () => {
  const { res, json } = await request('/api/community/submissions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': memberCookie
    },
    body: JSON.stringify({
      title: 'धूप का परिदृश्य (Sunlit Horizon)',
      contentType: 'poem',
      language: 'hi',
      script: 'Deva',
      excerpt: 'धूप और सायों के बीच मौन का विस्तार...',
      body: 'धूप उतरती है धीरे से छज्जों पर,\nजैसे कोई पुराना मित्र बिना कहे आ बैठा हो।',
      rightsDeclaration: 'I declare that this is my 100% original work and free of prior encumbrances.'
    })
  });

  assert.strictEqual(res.status, 201);
  assert.strictEqual(json.success, true);
  assert.strictEqual(json.status, 'submitted');
  assert.ok(json.submissionId.startsWith('sub_'));
});

// -----------------------------------------------------------------------------
// Category 6: Regression Verification (Public Routes & Existing Standards)
// -----------------------------------------------------------------------------
console.log('\n▶ Test Category 6: Regression & Public Pages');

await test('Regression - Public Poetry page renders with Reaction controls & Comments section', async () => {
  const { res, text } = await request('/poetry/smritiyon-ki-dehari-par');
  assert.strictEqual(res.status, 200);
  assert.ok(text.includes('work-reactions-section'), 'Missing WorkReactions section');
  assert.ok(text.includes('data-action="like"'), 'Missing Like button');
  assert.ok(text.includes('data-action="inspired"'), 'Missing Inspired button');
  assert.ok(text.includes('work-comments-section'), 'Missing WorkComments section');
  assert.ok(text.includes('data-query-modal-trigger'), 'Missing Author Query trigger');
});

await test('Regression - Public Prose page renders with Reaction controls & Comments section', async () => {
  const { res, text } = await request('/prose/the-keeper-of-forgotten-manuscripts');
  assert.strictEqual(res.status, 200);
  assert.ok(text.includes('work-reactions-section'), 'Missing WorkReactions section');
  assert.ok(text.includes('work-comments-section'), 'Missing WorkComments section');
  assert.ok(text.includes('data-query-modal-trigger'), 'Missing Author Query trigger');
});

await test('Regression - Public Community page renders properly', async () => {
  const { res, text } = await request('/community');
  assert.strictEqual(res.status, 200);
  assert.ok(text.includes('Creative Participation &amp; Community') || text.includes('Creative Participation & Community'));
  assert.ok(text.includes('Apply to Publish Creative Work'));
  assert.ok(text.includes('Apply to Collaborate with the Author'));
});

console.log('\n================================================================');
console.log(`🏁 Community Test Results: ${passed}/${passed + failed} Tests Passed (${Math.round((passed / (passed + failed)) * 100)}%)`);
console.log('================================================================');

if (failed > 0) {
  process.exit(1);
}
