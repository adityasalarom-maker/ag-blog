import { z } from 'astro/zod';

/**
 * Reaction Type Schema: Like & Inspired
 */
export const reactionTypeSchema = z.enum(['like', 'inspired']);
export type ReactionType = z.infer<typeof reactionTypeSchema>;

/**
 * Work Reaction Record Schema
 */
export const workReactionSchema = z.object({
  id: z.string().min(1),
  workId: z.string().min(1),
  reactionType: reactionTypeSchema,
  participantId: z.string().min(1), // Authenticated member ID or anonymous session ID
  createdAt: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}T/))
});
export type WorkReaction = z.infer<typeof workReactionSchema>;

/**
 * Aggregated Reaction Counts
 */
export interface WorkReactionSummary {
  workId: string;
  likeCount: number;
  inspiredCount: number;
  userLiked?: boolean;
  userInspired?: boolean;
}

/**
 * Comment Record Schema (with 1-level bounded threading)
 */
export const commentSchema = z.object({
  id: z.string().min(1),
  workId: z.string().min(1),
  parentCommentId: z.string().nullable().default(null), // null = top-level; string = reply
  authorName: z.string().min(1, 'Author name is required').max(80),
  authorEmail: z.string().email().optional(), // Private: never exposed publicly
  authorMemberId: z.string().optional(),
  content: z.string().min(2, 'Comment must be at least 2 characters').max(1500, 'Comment exceeds maximum length of 1500 characters'),
  status: z.enum(['approved', 'pending_review', 'hidden', 'flagged']).default('approved'),
  likeCount: z.number().int().nonnegative().default(0),
  replyCount: z.number().int().nonnegative().default(0),
  createdAt: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}T/)),
  updatedAt: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}T/)).optional()
});
export type Comment = z.infer<typeof commentSchema>;

/**
 * Comment Reaction Record Schema (1 like per user per comment)
 */
export const commentReactionSchema = z.object({
  id: z.string().min(1),
  commentId: z.string().min(1),
  participantId: z.string().min(1),
  createdAt: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}T/))
});
export type CommentReaction = z.infer<typeof commentReactionSchema>;

/**
 * Private Author Query Category Schema
 */
export const queryCategorySchema = z.enum([
  'question',
  'copyright_permission',
  'collaboration',
  'contribution',
  'general',
  'other'
]);
export type QueryCategory = z.infer<typeof queryCategorySchema>;

/**
 * Private Author Query Schema
 */
export const authorQuerySchema = z.object({
  id: z.string().min(1), // e.g., QRY-2026-ABC12
  senderName: z.string().min(1, 'Name is required').max(100),
  senderEmail: z.string().email('Valid reply-to email is required'),
  category: queryCategorySchema,
  subject: z.string().min(3, 'Subject must be at least 3 characters').max(200),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000),
  sourceWorkSlug: z.string().optional(),
  sourceWorkTitle: z.string().optional(),
  sourceWorkId: z.string().optional(),
  consentPrivacy: z.literal(true, {
    errorMap: () => ({ message: 'You must agree to the privacy notice' })
  }),
  deliveryStatus: z.enum(['delivered', 'queued', 'logged_unverified', 'failed']).default('logged_unverified'),
  deliveryDetails: z.string().optional(),
  createdAt: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}T/))
});
export type AuthorQuery = z.infer<typeof authorQuerySchema>;

/**
 * Community Member Profile Schema
 */
export const communityMemberSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  passwordHash: z.string().min(1),
  passwordSalt: z.string().min(1),
  role: z.literal('community_member').default('community_member'), // Strictly distinct from 'owner'
  bio: z.string().max(500).optional(),
  status: z.enum(['active', 'suspended', 'unverified']).default('active'),
  isApprovedContributor: z.boolean().default(false),
  isApprovedCollaborator: z.boolean().default(false),
  createdAt: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}T/)),
  lastLoginAt: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}T/)).optional()
});
export type CommunityMember = z.infer<typeof communityMemberSchema>;

/**
 * Participation Application Intent
 */
export const applicationIntentSchema = z.enum([
  'publish_work',
  'collaborate',
  'both'
]);
export type ApplicationIntent = z.infer<typeof applicationIntentSchema>;

/**
 * Contributor / Collaborator Application Schema
 */
export const participationApplicationSchema = z.object({
  id: z.string().min(1),
  memberId: z.string().min(1),
  applicantName: z.string().min(1),
  applicantEmail: z.string().email(),
  intent: applicationIntentSchema,
  proposalText: z.string().min(20, 'Proposal must be at least 20 characters').max(4000),
  creativeBackground: z.string().max(2000).optional(),
  sampleLinks: z.array(z.string().url()).default([]),
  status: z.enum([
    'pending',
    'under_review',
    'additional_info_requested',
    'approved',
    'rejected',
    'withdrawn'
  ]).default('pending'),
  adminFeedback: z.string().optional(),
  createdAt: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}T/)),
  updatedAt: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}T/))
});
export type ParticipationApplication = z.infer<typeof participationApplicationSchema>;

/**
 * Contributor Draft Submission Schema
 */
export const contributorSubmissionSchema = z.object({
  id: z.string().min(1),
  contributorId: z.string().min(1),
  contributorName: z.string().min(1),
  title: z.string().min(1).max(250),
  contentType: z.enum(['poem', 'story', 'essay', 'artwork', 'thought']),
  language: z.enum(['hi', 'en', 'mixed']),
  script: z.enum(['Deva', 'Latn', 'mixed']),
  excerpt: z.string().min(10).max(500),
  body: z.string().min(1),
  coverImage: z.string().optional(),
  tags: z.array(z.string()).default([]),
  rightsDeclaration: z.string().min(10, 'A clear originality and rights declaration is required'),
  status: z.enum(['submitted', 'editorial_review', 'approved_published', 'rejected', 'revision_requested']).default('submitted'),
  editorialNotes: z.string().optional(), // Strictly internal
  submittedAt: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}T/)),
  reviewedAt: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}T/)).optional()
});
export type ContributorSubmission = z.infer<typeof contributorSubmissionSchema>;
