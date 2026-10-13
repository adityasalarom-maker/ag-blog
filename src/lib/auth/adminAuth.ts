import crypto from 'node:crypto';

// Default owner credentials for local development if not configured in .env
const DEFAULT_ADMIN_PASSWORD = 'antigravity-review-owner-2026';
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'ag-literary-review-hmac-key-2026';
const SESSION_COOKIE_NAME = 'ag_admin_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface AdminSession {
  role: 'owner';
  name: string;
  issuedAt: number;
  expiresAt: number;
}

/**
 * Creates an HMAC-SHA256 signature for a payload string.
 */
function signPayload(payload: string): string {
  return crypto.createHmac('sha256', ADMIN_SECRET).update(payload).digest('hex');
}

/**
 * Generates a signed session token.
 */
export function createSessionToken(user = { role: 'owner' as const, name: 'A. G. Varma' }): string {
  const issuedAt = Date.now();
  const expiresAt = issuedAt + (SESSION_MAX_AGE_SECONDS * 1000);
  const data: AdminSession = {
    role: user.role,
    name: user.name,
    issuedAt,
    expiresAt
  };
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url');
  const signature = signPayload(payload);
  return `${payload}.${signature}`;
}

/**
 * Verifies a session token string.
 * Returns decoded session if valid, null otherwise.
 */
export function verifySessionToken(token: string): AdminSession | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payload, signature] = parts;
  const expectedSignature = signPayload(payload);

  // Timing safe comparison to prevent timing attacks
  try {
    const sigBuf = Buffer.from(signature, 'hex');
    const expBuf = Buffer.from(expectedSignature, 'hex');
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8')) as AdminSession;
    if (Date.now() > decoded.expiresAt) {
      return null; // Expired
    }

    return decoded;
  } catch {
    return null;
  }
}

/**
 * Verifies the owner password.
 */
export function verifyOwnerPassword(password: string): boolean {
  const configuredPassword = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
  if (!password || typeof password !== 'string') return false;

  const inputBuf = Buffer.from(password);
  const confBuf = Buffer.from(configuredPassword);
  if (inputBuf.length !== confBuf.length) return false;

  return crypto.timingSafeEqual(inputBuf, confBuf);
}

/**
 * Parses cookies from a Request header.
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
 * Core Authentication Guard for API and Server Routes.
 * Checks Cookie session or Authorization: Bearer token.
 */
export function verifyAdminAuth(request: Request): {
  authorized: boolean;
  session: AdminSession | null;
  error?: string;
} {
  // 1. Check Authorization Bearer header
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const session = verifySessionToken(token);
    if (session) {
      return { authorized: true, session };
    }
  }

  // 2. Check Cookie
  const cookies = parseCookies(request);
  const cookieToken = cookies[SESSION_COOKIE_NAME];
  if (cookieToken) {
    const session = verifySessionToken(cookieToken);
    if (session) {
      return { authorized: true, session };
    }
  }

  return {
    authorized: false,
    session: null,
    error: 'Unauthorized: Valid owner credentials or session token required.'
  };
}

/**
 * Generates standard 401 Unauthorized Response.
 */
export function unauthorizedResponse(message = 'Unauthorized: Admin authentication required.'): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: message
    }),
    {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'WWW-Authenticate': 'Bearer realm="Antigravity Review Owner"'
      }
    }
  );
}

/**
 * Generates the Set-Cookie header string for session establishment.
 */
export function createSessionCookie(token: string): string {
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Max-Age=${SESSION_MAX_AGE_SECONDS}; HttpOnly; SameSite=Lax`;
}

/**
 * Generates the Set-Cookie header string for session destruction (logout).
 */
export function createLogoutCookie(): string {
  return `${SESSION_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`;
}
