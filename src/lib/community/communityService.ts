import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  authorQuerySchema,
  participationApplicationSchema,
  contributorSubmissionSchema,
  type WorkReaction,
  type WorkReactionSummary,
  type Comment,
  type CommentReaction,
  type AuthorQuery,
  type CommunityMember,
  type ParticipationApplication,
  type ContributorSubmission,
  type ReactionType
} from './schema.ts';
import { getPublishedWorkBySlug, getAllWorksAdmin } from '../content/repository.ts';

const COMMUNITY_DATA_DIR = path.resolve(process.cwd(), 'data/community');

// File paths
const REACTIONS_FILE = path.join(COMMUNITY_DATA_DIR, 'reactions.json');
const COMMENTS_FILE = path.join(COMMUNITY_DATA_DIR, 'comments.json');
const COMMENT_REACTIONS_FILE = path.join(COMMUNITY_DATA_DIR, 'comment_reactions.json');
const QUERIES_FILE = path.join(COMMUNITY_DATA_DIR, 'queries.json');
const MEMBERS_FILE = path.join(COMMUNITY_DATA_DIR, 'members.json');
const APPLICATIONS_FILE = path.join(COMMUNITY_DATA_DIR, 'applications.json');
const SUBMISSIONS_FILE = path.join(COMMUNITY_DATA_DIR, 'submissions.json');

// Ensure directory exists
if (!fs.existsSync(COMMUNITY_DATA_DIR)) {
  fs.mkdirSync(COMMUNITY_DATA_DIR, { recursive: true });
}

/**
 * Generic Atomic File Reader
 */
function readJsonFile<T>(filePath: string, fallback: T[]): T[] {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2), 'utf-8');
      return fallback;
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`[Community Store] Error reading ${path.basename(filePath)}, using fallback:`, (err as Error).message);
    return fallback;
  }
}

/**
 * Generic Atomic File Writer
 */
function writeJsonFile<T>(filePath: string, data: T[]): void {
  const tempPath = `${filePath}.tmp.${Date.now()}`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempPath, filePath);
}

// In-memory caches for high-performance zero-lag queries
let reactionsCache: WorkReaction[] = readJsonFile<WorkReaction>(REACTIONS_FILE, []);
let commentsCache: Comment[] = readJsonFile<Comment>(COMMENTS_FILE, []);
let commentReactionsCache: CommentReaction[] = readJsonFile<CommentReaction>(COMMENT_REACTIONS_FILE, []);
let queriesCache: AuthorQuery[] = readJsonFile<AuthorQuery>(QUERIES_FILE, []);
let membersCache: CommunityMember[] = readJsonFile<CommunityMember>(MEMBERS_FILE, []);
let applicationsCache: ParticipationApplication[] = readJsonFile<ParticipationApplication>(APPLICATIONS_FILE, []);
let submissionsCache: ContributorSubmission[] = readJsonFile<ContributorSubmission>(SUBMISSIONS_FILE, []);

// Pre-aggregated count index for work reactions: Map<workId, { likes: number, inspired: number }>
const reactionCountsIndex = new Map<string, { likes: number; inspired: number }>();
function rebuildReactionCounts() {
  reactionCountsIndex.clear();
  for (const r of reactionsCache) {
    const entry = reactionCountsIndex.get(r.workId) || { likes: 0, inspired: 0 };
    if (r.reactionType === 'like') entry.likes++;
    if (r.reactionType === 'inspired') entry.inspired++;
    reactionCountsIndex.set(r.workId, entry);
  }
}
rebuildReactionCounts();

// Simple in-memory rate limiter: Map<ip_or_id, number[]> (timestamps)
const rateLimits = new Map<string, number[]>();
export function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const timestamps = (rateLimits.get(key) || []).filter(t => now - t < windowMs);
  if (timestamps.length >= maxRequests) {
    return false; // Rate limit exceeded
  }
  timestamps.push(now);
  rateLimits.set(key, timestamps);
  return true;
}

/**
 * Sanitizes user-submitted HTML to prevent script injection
 */
export function sanitizeText(input: string): string {
  if (!input) return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

/**
 * Validates whether a work exists and is currently published.
 * Draft and archived works are rejected from receiving reactions or comments.
 */
export function isWorkPublished(workSlugOrId: string): boolean {
  const published = getPublishedWorkBySlug(workSlugOrId);
  if (published) return true;
  // Check if target was ID or slug
  const adminWorks = getAllWorksAdmin();
  const work = adminWorks.find(w => w.id === workSlugOrId || w.slug === workSlugOrId);
  return work ? work.status === 'published' : false;
}

// ==============================================================================
// FEATURE A: LIKE & INSPIRED WORK REACTIONS
// ==============================================================================

export function getWorkReactionsSummary(workId: string, participantId?: string): WorkReactionSummary {
  const counts = reactionCountsIndex.get(workId) || { likes: 0, inspired: 0 };
  let userLiked = false;
  let userInspired = false;

  if (participantId) {
    for (const r of reactionsCache) {
      if (r.workId === workId && r.participantId === participantId) {
        if (r.reactionType === 'like') userLiked = true;
        if (r.reactionType === 'inspired') userInspired = true;
      }
    }
  }

  return {
    workId,
    likeCount: counts.likes,
    inspiredCount: counts.inspired,
    userLiked,
    userInspired
  };
}

export function toggleWorkReaction(
  workId: string,
  reactionType: ReactionType,
  participantId: string
): { success: boolean; active: boolean; summary: WorkReactionSummary; error?: string } {
  if (!isWorkPublished(workId)) {
    return {
      success: false,
      active: false,
      summary: getWorkReactionsSummary(workId, participantId),
      error: 'Cannot react to an unpublished, archived, or non-existent work.'
    };
  }

  const existingIdx = reactionsCache.findIndex(
    r => r.workId === workId && r.reactionType === reactionType && r.participantId === participantId
  );

  let active = false;
  if (existingIdx >= 0) {
    // Remove reaction (toggle off)
    reactionsCache.splice(existingIdx, 1);
    active = false;
  } else {
    // Add reaction
    const newReaction: WorkReaction = {
      id: `rxn_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      workId,
      reactionType,
      participantId,
      createdAt: new Date().toISOString()
    };
    reactionsCache.push(newReaction);
    active = true;
  }

  rebuildReactionCounts();
  writeJsonFile(REACTIONS_FILE, reactionsCache);

  return {
    success: true,
    active,
    summary: getWorkReactionsSummary(workId, participantId)
  };
}

// ==============================================================================
// FEATURE B: COMMENTS, REPLIES & COMMENT LIKES
// ==============================================================================

export function getCommentsForWork(workId: string, options?: { page?: number; limit?: number; currentParticipantId?: string }) {
  const page = options?.page || 1;
  const limit = options?.limit || 20;

  // Filter approved comments for this work
  const workComments = commentsCache.filter(c => c.workId === workId && c.status === 'approved');

  // Top-level comments
  const topLevel = workComments.filter(c => !c.parentCommentId);
  // Sort newest first
  topLevel.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Paginate top-level
  const totalTopLevel = topLevel.length;
  const startIndex = (page - 1) * limit;
  const paginatedTop = topLevel.slice(startIndex, startIndex + limit);

  // Attach 1-level replies
  const replies = workComments.filter(c => c.parentCommentId !== null);
  const repliesByParent = new Map<string, Comment[]>();
  for (const rep of replies) {
    const list = repliesByParent.get(rep.parentCommentId!) || [];
    list.push(rep);
    repliesByParent.set(rep.parentCommentId!, list);
  }

  // Check liked status for viewer
  const participantLikedCommentIds = new Set<string>();
  if (options?.currentParticipantId) {
    for (const cr of commentReactionsCache) {
      if (cr.participantId === options.currentParticipantId) {
        participantLikedCommentIds.add(cr.commentId);
      }
    }
  }

  const results = paginatedTop.map(c => {
    const commentReplies = (repliesByParent.get(c.id) || []).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return {
      ...c,
      userLiked: participantLikedCommentIds.has(c.id),
      replies: commentReplies.map(r => ({
        ...r,
        userLiked: participantLikedCommentIds.has(r.id)
      }))
    };
  });

  return {
    totalComments: workComments.length,
    totalTopLevel,
    page,
    limit,
    hasMore: startIndex + limit < totalTopLevel,
    comments: results
  };
}

export function addComment(params: {
  workId: string;
  parentCommentId?: string | null;
  authorName: string;
  authorEmail?: string;
  authorMemberId?: string;
  content: string;
}): { success: boolean; comment?: Comment; error?: string } {
  if (!isWorkPublished(params.workId)) {
    return { success: false, error: 'Cannot comment on an unpublished or non-existent work.' };
  }

  const cleanAuthor = sanitizeText(params.authorName);
  const cleanContent = sanitizeText(params.content);

  if (!cleanAuthor || cleanAuthor.length < 1) {
    return { success: false, error: 'Author display name is required.' };
  }

  if (!cleanContent || cleanContent.length < 2) {
    return { success: false, error: 'Comment must be at least 2 characters long.' };
  }

  if (cleanContent.length > 1500) {
    return { success: false, error: 'Comment cannot exceed 1500 characters.' };
  }

  // If this is a reply, verify parent exists and is top-level (strictly 1-level nesting)
  let parentId: string | null = null;
  if (params.parentCommentId) {
    const parent = commentsCache.find(c => c.id === params.parentCommentId && c.workId === params.workId);
    if (!parent) {
      return { success: false, error: 'Parent comment not found.' };
    }
    // Prevent nested replies beyond 1 level
    parentId = parent.parentCommentId ? parent.parentCommentId : parent.id;
  }

  const newComment: Comment = {
    id: `cmt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    workId: params.workId,
    parentCommentId: parentId,
    authorName: cleanAuthor,
    authorEmail: params.authorEmail?.trim() || undefined,
    authorMemberId: params.authorMemberId,
    content: cleanContent,
    status: 'approved',
    likeCount: 0,
    replyCount: 0,
    createdAt: new Date().toISOString()
  };

  commentsCache.push(newComment);

  // Update parent reply count
  if (parentId) {
    const parent = commentsCache.find(c => c.id === parentId);
    if (parent) {
      parent.replyCount = (parent.replyCount || 0) + 1;
    }
  }

  writeJsonFile(COMMENTS_FILE, commentsCache);
  return { success: true, comment: newComment };
}

export function toggleCommentLike(
  commentId: string,
  participantId: string
): { success: boolean; active: boolean; likeCount: number; error?: string } {
  const comment = commentsCache.find(c => c.id === commentId && c.status === 'approved');
  if (!comment) {
    return { success: false, active: false, likeCount: 0, error: 'Comment not found.' };
  }

  const existingIdx = commentReactionsCache.findIndex(
    cr => cr.commentId === commentId && cr.participantId === participantId
  );

  let active = false;
  if (existingIdx >= 0) {
    commentReactionsCache.splice(existingIdx, 1);
    comment.likeCount = Math.max(0, (comment.likeCount || 0) - 1);
    active = false;
  } else {
    commentReactionsCache.push({
      id: `crx_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      commentId,
      participantId,
      createdAt: new Date().toISOString()
    });
    comment.likeCount = (comment.likeCount || 0) + 1;
    active = true;
  }

  writeJsonFile(COMMENTS_FILE, commentsCache);
  writeJsonFile(COMMENT_REACTIONS_FILE, commentReactionsCache);

  return { success: true, active, likeCount: comment.likeCount };
}

export function moderateComment(
  commentId: string,
  action: 'approve' | 'hide' | 'flag' | 'delete'
): { success: boolean; error?: string } {
  const commentIdx = commentsCache.findIndex(c => c.id === commentId);
  if (commentIdx < 0) {
    return { success: false, error: 'Comment not found' };
  }

  if (action === 'delete') {
    commentsCache.splice(commentIdx, 1);
  } else if (action === 'approve') {
    commentsCache[commentIdx].status = 'approved';
  } else if (action === 'hide') {
    commentsCache[commentIdx].status = 'hidden';
  } else if (action === 'flag') {
    commentsCache[commentIdx].status = 'flagged';
  }

  writeJsonFile(COMMENTS_FILE, commentsCache);
  return { success: true };
}

export function getAllCommentsAdmin(workId?: string): Comment[] {
  if (workId) {
    return commentsCache.filter(c => c.workId === workId);
  }
  return [...commentsCache];
}

// ==============================================================================
// FEATURE C: PRIVATE AUTHOR QUERIES
// ==============================================================================

export function submitAuthorQuery(queryData: Omit<AuthorQuery, 'id' | 'createdAt' | 'deliveryStatus'>): {
  success: boolean;
  queryId?: string;
  error?: string;
} {
  const queryId = `QRY-${new Date().getFullYear()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

  const cleanName = sanitizeText(queryData.senderName);
  const cleanSubject = sanitizeText(queryData.subject);
  const cleanMessage = sanitizeText(queryData.message);

  const query: AuthorQuery = {
    ...queryData,
    id: queryId,
    senderName: cleanName,
    subject: cleanSubject,
    message: cleanMessage,
    deliveryStatus: 'logged_unverified',
    createdAt: new Date().toISOString()
  };

  const validation = authorQuerySchema.safeParse(query);
  if (!validation.success) {
    return { success: false, error: validation.error.errors[0]?.message || 'Invalid query data' };
  }

  queriesCache.unshift(query);
  writeJsonFile(QUERIES_FILE, queriesCache);

  return { success: true, queryId };
}

export function getAllQueriesAdmin(): AuthorQuery[] {
  return [...queriesCache];
}

export function updateQueryDeliveryStatus(queryId: string, status: AuthorQuery['deliveryStatus'], details?: string): void {
  const q = queriesCache.find(item => item.id === queryId);
  if (q) {
    q.deliveryStatus = status;
    q.deliveryDetails = details;
    writeJsonFile(QUERIES_FILE, queriesCache);
  }
}

// ==============================================================================
// FEATURE D: COMMUNITY REGISTRATION & PARTICIPATION APPLICATIONS
// ==============================================================================

export function registerCommunityMember(params: {
  name: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  bio?: string;
}): { success: boolean; member?: CommunityMember; error?: string } {
  const cleanEmail = params.email.trim().toLowerCase();
  const existing = membersCache.find(m => m.email === cleanEmail);
  if (existing) {
    return { success: false, error: 'An account with this email address already exists.' };
  }

  const member: CommunityMember = {
    id: `mbr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    name: sanitizeText(params.name),
    email: cleanEmail,
    passwordHash: params.passwordHash,
    passwordSalt: params.passwordSalt,
    role: 'community_member',
    bio: params.bio ? sanitizeText(params.bio) : undefined,
    status: 'active',
    isApprovedContributor: false,
    isApprovedCollaborator: false,
    createdAt: new Date().toISOString()
  };

  membersCache.push(member);
  writeJsonFile(MEMBERS_FILE, membersCache);

  return { success: true, member };
}

export function getMemberByEmail(email: string): CommunityMember | undefined {
  return membersCache.find(m => m.email === email.trim().toLowerCase());
}

export function getMemberById(id: string): CommunityMember | undefined {
  return membersCache.find(m => m.id === id);
}

export function submitParticipationApplication(params: {
  memberId: string;
  intent: ParticipationApplication['intent'];
  proposalText: string;
  creativeBackground?: string;
  sampleLinks?: string[];
}): { success: boolean; application?: ParticipationApplication; error?: string } {
  const member = getMemberById(params.memberId);
  if (!member) {
    return { success: false, error: 'Community member not found.' };
  }

  const app: ParticipationApplication = {
    id: `app_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    memberId: member.id,
    applicantName: member.name,
    applicantEmail: member.email,
    intent: params.intent,
    proposalText: sanitizeText(params.proposalText),
    creativeBackground: params.creativeBackground ? sanitizeText(params.creativeBackground) : undefined,
    sampleLinks: params.sampleLinks || [],
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const validation = participationApplicationSchema.safeParse(app);
  if (!validation.success) {
    return { success: false, error: validation.error.errors[0]?.message || 'Invalid application proposal.' };
  }

  applicationsCache.unshift(app);
  writeJsonFile(APPLICATIONS_FILE, applicationsCache);

  return { success: true, application: app };
}

export function getApplicationsAdmin(): ParticipationApplication[] {
  return [...applicationsCache];
}

export function reviewParticipationApplication(
  appId: string,
  decision: ParticipationApplication['status'],
  feedback?: string
): { success: boolean; error?: string } {
  const app = applicationsCache.find(a => a.id === appId);
  if (!app) {
    return { success: false, error: 'Application not found.' };
  }

  app.status = decision;
  app.adminFeedback = feedback ? sanitizeText(feedback) : undefined;
  app.updatedAt = new Date().toISOString();

  // If approved, update member permissions accordingly
  if (decision === 'approved') {
    const member = membersCache.find(m => m.id === app.memberId);
    if (member) {
      if (app.intent === 'publish_work' || app.intent === 'both') {
        member.isApprovedContributor = true;
      }
      if (app.intent === 'collaborate' || app.intent === 'both') {
        member.isApprovedCollaborator = true;
      }
      writeJsonFile(MEMBERS_FILE, membersCache);
    }
  }

  writeJsonFile(APPLICATIONS_FILE, applicationsCache);
  return { success: true };
}

export function submitContributorWork(params: {
  contributorId: string;
  title: string;
  contentType: ContributorSubmission['contentType'];
  language: ContributorSubmission['language'];
  script: ContributorSubmission['script'];
  excerpt: string;
  body: string;
  coverImage?: string;
  tags?: string[];
  rightsDeclaration: string;
}): { success: boolean; submission?: ContributorSubmission; error?: string } {
  const member = getMemberById(params.contributorId);
  if (!member || !member.isApprovedContributor) {
    return { success: false, error: 'Unauthorized: Only approved contributors can submit drafts.' };
  }

  const sub: ContributorSubmission = {
    id: `sub_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    contributorId: member.id,
    contributorName: member.name,
    title: sanitizeText(params.title),
    contentType: params.contentType,
    language: params.language,
    script: params.script,
    excerpt: sanitizeText(params.excerpt),
    body: sanitizeText(params.body),
    coverImage: params.coverImage,
    tags: (params.tags || []).map(t => sanitizeText(t)),
    rightsDeclaration: sanitizeText(params.rightsDeclaration),
    status: 'submitted',
    submittedAt: new Date().toISOString()
  };

  const validation = contributorSubmissionSchema.safeParse(sub);
  if (!validation.success) {
    return { success: false, error: validation.error.errors[0]?.message || 'Invalid submission data.' };
  }

  submissionsCache.unshift(sub);
  writeJsonFile(SUBMISSIONS_FILE, submissionsCache);

  return { success: true, submission: sub };
}

export function getSubmissionsAdmin(): ContributorSubmission[] {
  return [...submissionsCache];
}
