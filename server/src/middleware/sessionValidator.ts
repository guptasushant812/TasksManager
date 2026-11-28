import { Request, Response, NextFunction } from 'express';
import { getCachedPasswordUpdatedAt } from '../controllers/settingsController';
import { isOriginAllowed, getSessionCookieOptions } from '../utils/security';
import AuthSession from '../models/AuthSession';

interface CachedSession {
  status: 'active' | 'logged_out' | 'expired' | 'revoked';
  expiresAt: number | null;
  loginAt: number;
  cachedAt: number;
  lastDbActiveUpdate?: number;
}

const activeSessionCache = new Map<string, CachedSession>();

export function invalidateSessionCache(token?: string): void {
  if (token) {
    activeSessionCache.delete(token);
  } else {
    activeSessionCache.clear();
  }
}

export function parseCookies(cookieHeader?: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!cookieHeader) return result;
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const idx = part.indexOf('=');
    if (idx !== -1) {
      const key = part.slice(0, idx).trim();
      const val = part.slice(idx + 1).trim();
      result[key] = decodeURIComponent(val);
    }
  }
  return result;
}

export async function sessionValidator(req: Request, res: Response, next: NextFunction) {
  // Public endpoints accessible without authentication
  const isPublic =
    req.path === '/health' ||
    req.path.startsWith('/public') ||
    req.path.startsWith('/f/') ||
    req.path === '/settings/verify-password' ||
    req.path === '/settings/password-status' ||
    req.path === '/settings/logout' ||
    req.path === '/settings/session-timeout';

  if (isPublic) {
    return next();
  }

  // CSRF Protection: Block unauthorized cross-site state mutations (POST, PUT, PATCH, DELETE)
  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method.toUpperCase());
  if (isMutation) {
    const origin = req.headers.origin;
    const referer = req.headers.referer;

    if (origin) {
      if (!isOriginAllowed(origin)) {
        res.status(403).json({
          error: 'CSRF_BLOCKED',
          message: 'Cross-Site Request Forgery attempt blocked: Unauthorized Origin.',
        });
        return;
      }
    } else if (referer) {
      try {
        const refOrigin = new URL(referer).origin;
        if (!isOriginAllowed(refOrigin)) {
          res.status(403).json({
            error: 'CSRF_BLOCKED',
            message: 'Cross-Site Request Forgery attempt blocked: Unauthorized Referer.',
          });
          return;
        }
      } catch {
        res.status(403).json({
          error: 'CSRF_BLOCKED',
          message: 'Cross-Site Request Forgery attempt blocked: Malformed Referer.',
        });
        return;
      }
    } else if (req.headers['sec-fetch-site'] === 'cross-site') {
      res.status(403).json({
        error: 'CSRF_BLOCKED',
        message: 'Cross-Site Request Forgery attempt blocked: Untrusted cross-site site header.',
      });
      return;
    }
  }

  // 1. Verify password freshness against server to catch global credential updates
  const clientUpdatedAt = req.headers['x-password-updated-at'];
  if (typeof clientUpdatedAt === 'string' && clientUpdatedAt.trim()) {
    try {
      const clientTime = new Date(clientUpdatedAt).getTime();
      if (!isNaN(clientTime)) {
        const serverUpdatedAt = await getCachedPasswordUpdatedAt();
        if (serverUpdatedAt) {
          const serverTime = serverUpdatedAt.getTime();
          if (serverTime > clientTime + 1000) {
            res.status(401).json({
              error: 'PASSWORD_CHANGED',
              message: 'Master password has been updated. Please unlock with your new password.',
            });
            return;
          }
        }
      }
    } catch {}
  }

  // 2. Extract and reconcile session tokens across Cookie, Header, and Bearer
  const cookies = parseCookies(req.headers.cookie);
  const cookieToken = cookies['tasksmanager_session_token'];
  const headerToken = req.headers['x-session-token'];
  const authHeader = req.headers['authorization'];
  let bearerToken: string | undefined;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    bearerToken = authHeader.slice(7).trim();
  }

  const cleanCookie = typeof cookieToken === 'string' && cookieToken.trim() ? cookieToken.trim() : undefined;
  const cleanHeader = typeof headerToken === 'string' && headerToken.trim() ? headerToken.trim() : undefined;
  const cleanBearer = typeof bearerToken === 'string' && bearerToken.trim() ? bearerToken.trim() : undefined;

  // Authoritative credential preference: Header/Bearer sent explicitly by client takes precedence,
  // with fallback to HttpOnly cookie.
  let sessionToken = cleanHeader || cleanBearer || cleanCookie || null;

  // Strict server verification: Every protected API request must have a session token
  if (!sessionToken) {
    res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Authentication required. Please unlock your workspace to access this resource.',
    });
    return;
  }

  // Allow bypass for local automated tests if token matches e2e pattern
  if (process.env.NODE_ENV !== 'production' && sessionToken.startsWith('e2e_test_')) {
    return next();
  }

  // 3. Verify session in cache or database
  const now = Date.now();
  let sessionData = activeSessionCache.get(sessionToken);

  if (!sessionData || now - sessionData.cachedAt > 15000) {
    let session = await AuthSession.findOne({ sessionToken }, 'status expiresAt loginAt').lean();

    // Fallback: If header token wasn't found in DB but cookie is present and differs, check cookie
    if (!session && cleanCookie && cleanCookie !== sessionToken) {
      const cookieSession = await AuthSession.findOne({ sessionToken: cleanCookie }, 'status expiresAt loginAt').lean();
      if (cookieSession) {
        sessionToken = cleanCookie;
        session = cookieSession;
      }
    }

    if (!session) {
      res.status(401).json({
        error: 'INVALID_SESSION',
        message: 'Invalid session token. Please re-authenticate.',
      });
      return;
    }

    sessionData = {
      status: session.status,
      expiresAt: session.expiresAt ? new Date(session.expiresAt).getTime() : null,
      loginAt: session.loginAt ? new Date(session.loginAt).getTime() : 0,
      cachedAt: now,
    };
    activeSessionCache.set(sessionToken, sessionData);
  }

  // If client provided a different/stale cookie, refresh it to keep them in sync
  if (cleanCookie && cleanCookie !== sessionToken) {
    try {
      res.cookie('tasksmanager_session_token', sessionToken, getSessionCookieOptions());
    } catch {}
  }

  // Check if master password was updated after session login
  const serverUpdatedAt = await getCachedPasswordUpdatedAt();
  if (serverUpdatedAt && sessionData.loginAt > 0 && sessionData.loginAt < serverUpdatedAt.getTime() - 1000) {
    activeSessionCache.delete(sessionToken);
    await AuthSession.updateOne({ sessionToken }, { $set: { status: 'revoked' } }).catch(() => {});
    res.status(401).json({
      error: 'PASSWORD_CHANGED',
      message: 'Master password has been updated. Please unlock with your new password.',
    });
    return;
  }

  if (sessionData.status === 'revoked') {
    res.status(401).json({
      error: 'PASSWORD_CHANGED',
      message: 'Session has been revoked due to credential changes. Please unlock again.',
    });
    return;
  }

  if (sessionData.status === 'logged_out') {
    res.status(401).json({
      error: 'LOGGED_OUT',
      message: 'Session has been logged out. Please unlock to continue.',
    });
    return;
  }

  if (sessionData.status === 'expired') {
    res.status(401).json({
      error: 'SESSION_EXPIRED',
      message: 'Session has expired. Please unlock to continue.',
    });
    return;
  }

  if (sessionData.expiresAt && now > sessionData.expiresAt) {
    activeSessionCache.delete(sessionToken);
    await AuthSession.updateOne({ sessionToken }, { $set: { status: 'expired' } }).catch(() => {});
    res.status(401).json({
      error: 'SESSION_EXPIRED',
      message: 'Session has expired due to timeout. Please unlock to continue.',
    });
    return;
  }

  // Throttled background touch to update lastActiveAt in database
  const lastActiveUpdate = sessionData.lastDbActiveUpdate || 0;
  if (now - lastActiveUpdate > 60000) {
    sessionData.lastDbActiveUpdate = now;
    AuthSession.updateOne({ sessionToken }, { $set: { lastActiveAt: new Date(now) } }).catch(() => {});
  }

  (req as any).sessionToken = sessionToken;
  (req as any).authSession = sessionData;

  next();
}
