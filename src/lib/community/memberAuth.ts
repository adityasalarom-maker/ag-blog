import crypto from 'node:crypto';
import type { CommunityMember } from './schema.ts';

const COMMUNITY_AUTH_SECRET = process.env.COMMUNITY_AUTH_SECRET || process.env.ADMIN_SECRET || 'ag-community-hmac-secret-2026';
const MEMBER_SESSION_COOKIE = 'ag_member_session';
const VISITOR_COOKIE = 'ag_visitor_id';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export interface MemberSession {
  role: 'community_member';
  memberId: string;
  name: string;
  email: string;
  isApprovedContributor: boolean;
  isApprovedCollaborator: boolean;
  issuedAt: number;
  expiresAt: number;
}

/**
 * Creates PBKDF2 password hash with salt.
 */
export function hashPassword(password: string): { salt: string; hash: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

/**
 * Verifies password against stored salt and hash.
 */
export function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  if (!password || !salt || !expectedHash) return false;
  try {
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    const hashBuf = Buffer.from(hash, 'hex');
    const expBuf = Buffer.from(expectedHash, 'hex');
    if (hashBuf.length !== expBuf.length) return false;
    return crypto.timingSafeEqual(hashBuf, expBuf);
  } catch {
    return false;
  }
}

/**
 * Signs payload with HMAC-SHA256.
 */
function signPayload(payload: string): string {
  return crypto.createHmac('sha256', COMMUNITY_AUTH_SECRET).update(payload).digest('hex');
}

/**
 * Creates signed session token for a community member.
 */
export function createMemberSessionToken(member: CommunityMember): string {
  const issuedAt = Date.now();
  const expiresAt = issuedAt + (SESSION_MAX_AGE_SECONDS * 1000);
  const sessionData: MemberSession = {
    role: 'community_member',
    memberId: member.id,
    name: member.name,
    email: member.email,
    isApprovedContributor: member.isApprovedContributor,
    isApprovedCollaborator: member.isApprovedCollaborator,
    issuedAt,
    expiresAt
  };
  const payload = Buffer.from(JSON.stringify(sessionData)).toString('base64url');
  const signature = signPayload(payload);
  return `${payload}.${signature}`;
}

/**
 * Verifies member session token.
 */
export function verifyMemberSessionToken(token: string): MemberSession | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payload, signature] = parts;
  const expectedSignature = signPayload(payload);

  try {
    const sigBuf = Buffer.from(signature, 'hex');
    const expBuf = Buffer.from(expectedSignature, 'hex');
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8')) as MemberSession;
    if (Date.now() > decoded.expiresAt || decoded.role !== 'community_member') {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
}

/**
 * Parses cookies from HTTP Request.
 */
export function parseCookies(request: Request): Record<string, string> {
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies: Record<string, string> = {};
  cookieHeader.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    if (parts.length >= 2) {
      const name = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      cookies[name] = decodeURIComponent(val);
    }
  });
  return cookies;
}

/**
 * Verifies authenticated community member from request (Bearer or Cookie).
 */
export function getMemberSessionFromRequest(request: Request): MemberSession | null {
  // 1. Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const session = verifyMemberSessionToken(token);
    if (session) return session;
  }

  // 2. Cookie
  const cookies = parseCookies(request);
  const token = cookies[MEMBER_SESSION_COOKIE];
  if (token) {
    return verifyMemberSessionToken(token);
  }

  return null;
}

/**
 * Extracts or generates an abuse-resistant participant ID for reactions/comments:
 * - If authenticated: returns `usr_<memberId>`.
 * - If anonymous: returns signed visitor token from cookie or creates one.
 */
export function getParticipantId(request: Request): {
  participantId: string;
  isAuthenticated: boolean;
  memberSession: MemberSession | null;
  newVisitorCookie?: string;
} {
  const member = getMemberSessionFromRequest(request);
  if (member) {
    return {
      participantId: `usr_${member.memberId}`,
      isAuthenticated: true,
      memberSession: member
    };
  }

  const cookies = parseCookies(request);
  const existingVisitor = cookies[VISITOR_COOKIE];

  if (existingVisitor && verifyVisitorToken(existingVisitor)) {
    return {
      participantId: `vis_${existingVisitor.split('.')[0]}`,
      isAuthenticated: false,
      memberSession: null
    };
  }

  // Generate new tamper-evident anonymous visitor token
  const visitorRawId = crypto.randomBytes(16).toString('hex');
  const signature = signPayload(visitorRawId);
  const token = `${visitorRawId}.${signature}`;
  const cookie = `${VISITOR_COOKIE}=${token}; Path=/; Max-Age=${SESSION_MAX_AGE_SECONDS}; HttpOnly; SameSite=Lax`;

  return {
    participantId: `vis_${visitorRawId}`,
    isAuthenticated: false,
    memberSession: null,
    newVisitorCookie: cookie
  };
}

/**
 * Verifies signed visitor cookie token.
 */
function verifyVisitorToken(token: string): boolean {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [rawId, signature] = parts;
  const expectedSig = signPayload(rawId);
  try {
    const sigBuf = Buffer.from(signature, 'hex');
    const expBuf = Buffer.from(expectedSig, 'hex');
    return sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);
  } catch {
    return false;
  }
}

export function createMemberCookie(token: string): string {
  return `${MEMBER_SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${SESSION_MAX_AGE_SECONDS}; HttpOnly; SameSite=Lax`;
}

export function createMemberLogoutCookie(): string {
  return `${MEMBER_SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`;
}
