import { Request, Response, NextFunction } from 'express';
import Settings from '../models/Settings';
import AuthSession from '../models/AuthSession';
import LoginAttempt from '../models/LoginAttempt';
import { parseClientInfo } from '../utils/deviceParser';
import { invalidateSessionCache, parseCookies } from '../middleware/sessionValidator';
import {
  hashPassword,
  verifyPassword,
  generateSessionToken,
  checkBruteForceLock,
  recordFailedAttempt,
  resetFailedAttempts,
  getSessionCookieOptions,
} from '../utils/security';

function extractRequestToken(req: Request): string | undefined {
  const cookies = parseCookies(req.headers.cookie);
  const cookieToken = cookies['tasksmanager_session_token'];
  const headerToken = req.headers['x-session-token'];
  const authHeader = req.headers['authorization'];
  let bearerToken: string | undefined;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    bearerToken = authHeader.slice(7).trim();
  }
  const raw = req.body?.sessionToken || cookieToken || (typeof headerToken === 'string' ? headerToken : undefined) || bearerToken;
  return typeof raw === 'string' && raw.trim() ? raw.trim() : undefined;
}

// In-memory cache for passwordUpdatedAt to avoid redundant DB queries on every request
let cachedPasswordUpdatedAt: Date | null = null;
let lastPasswordCacheTime = 0;

export async function getCachedPasswordUpdatedAt(): Promise<Date | null> {
  const now = Date.now();
  if (cachedPasswordUpdatedAt && now - lastPasswordCacheTime < 15000) {
    return cachedPasswordUpdatedAt;
  }
  const settings = await Settings.findOne({}, 'passwordUpdatedAt').lean();
  cachedPasswordUpdatedAt = settings?.passwordUpdatedAt ? new Date(settings.passwordUpdatedAt) : null;
  lastPasswordCacheTime = now;
  return cachedPasswordUpdatedAt;
}

export function invalidatePasswordCache(newDate?: Date | null): void {
  cachedPasswordUpdatedAt = newDate || null;
  lastPasswordCacheTime = Date.now();
}

export async function getSettings(req: Request, res: Response, next: NextFunction) {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    const data: any = settings.toObject ? settings.toObject() : { ...settings };
    delete data.masterPasswordHash;
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function updateSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const { isPublicShareEnabled, aiKeys, preferredAiModel, activeAiProvider } = req.body;
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    if (typeof isPublicShareEnabled === 'boolean') {
      settings.isPublicShareEnabled = isPublicShareEnabled;
    }

    if (aiKeys && typeof aiKeys === 'object') {
      settings.aiKeys = {
        gemini: typeof aiKeys.gemini === 'string' ? aiKeys.gemini.trim() : (settings.aiKeys?.gemini || ''),
        groq: typeof aiKeys.groq === 'string' ? aiKeys.groq.trim() : (settings.aiKeys?.groq || ''),
        grok: typeof aiKeys.grok === 'string' ? aiKeys.grok.trim() : (settings.aiKeys?.grok || ''),
      };
    }

    if (typeof preferredAiModel === 'string') {
      settings.preferredAiModel = preferredAiModel;
    }

    if (typeof activeAiProvider === 'string') {
      settings.activeAiProvider = activeAiProvider;
    }

    await settings.save();
    const data: any = settings.toObject ? settings.toObject() : { ...settings };
    delete data.masterPasswordHash;
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function regenerateToken(req: Request, res: Response, next: NextFunction) {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    settings.publicShareToken = require('crypto').randomBytes(16).toString('hex');
    await settings.save();

    const data: any = settings.toObject ? settings.toObject() : { ...settings };
    delete data.masterPasswordHash;
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function getPasswordStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const updatedAt = await getCachedPasswordUpdatedAt();
    res.json({
      passwordUpdatedAt: updatedAt ? updatedAt.toISOString() : null,
    });
  } catch (err) {
    next(err);
  }
}

export async function getMasterPasswordHash(req: Request, res: Response, next: NextFunction) {
  try {
    const settings = await Settings.findOne({}, 'masterPasswordHash passwordUpdatedAt').lean();
    const hash = settings?.masterPasswordHash || null;
    res.json({
      hash,
      passwordUpdatedAt: settings?.passwordUpdatedAt ? new Date(settings.passwordUpdatedAt).toISOString() : null,
    });
  } catch (err) {
    next(err);
  }
}

export async function verifyMasterPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { password, timeoutMs, maxSessionMs } = req.body;
    const clientInfo = parseClientInfo(req);

    // Enforce server-side brute-force lockout
    const lockStatus = checkBruteForceLock(clientInfo.ipAddress);
    if (lockStatus.isLocked) {
      await LoginAttempt.create({
        ipAddress: clientInfo.ipAddress,
        userAgent: req.headers['user-agent'] || '',
        browser: clientInfo.browser,
        os: clientInfo.os,
        device: clientInfo.device,
        success: false,
        failureReason: 'Rate limit lockout',
      }).catch(() => {});

      const minutes = Math.max(1, Math.ceil(lockStatus.remainingSeconds / 60));
      res.status(429).json({
        valid: false,
        locked: true,
        remainingSeconds: lockStatus.remainingSeconds,
        error: `Too many failed attempts. Account temporarily locked. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`,
      });
      return;
    }

    if (typeof password !== 'string' || !password.trim()) {
      res.status(400).json({ valid: false, error: 'Password is required' });
      return;
    }

    const trimmed = password.trim();
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }

    let storedHash = settings.masterPasswordHash;
    if (!storedHash) {
      const defaultPassword = process.env.INITIAL_MASTER_PASSWORD || 'Sun123@';
      storedHash = hashPassword(defaultPassword);
      settings.masterPasswordHash = storedHash;
      settings.passwordUpdatedAt = new Date();
      await settings.save();
      invalidatePasswordCache(settings.passwordUpdatedAt);
    }

    const isValid = verifyPassword(trimmed, storedHash);

    if (!isValid) {
      const failResult = recordFailedAttempt(clientInfo.ipAddress);

      await LoginAttempt.create({
        ipAddress: clientInfo.ipAddress,
        userAgent: req.headers['user-agent'] || '',
        browser: clientInfo.browser,
        os: clientInfo.os,
        device: clientInfo.device,
        success: false,
        failureReason: 'Incorrect password',
      }).catch(() => {});

      if (failResult.isLocked) {
        const minutes = Math.max(1, Math.ceil(failResult.lockoutSeconds / 60));
        res.status(429).json({
          valid: false,
          locked: true,
          remainingSeconds: failResult.lockoutSeconds,
          error: `Too many failed attempts. Account temporarily locked for ${minutes} minutes.`,
        });
        return;
      }

      res.status(401).json({
        valid: false,
        remainingAttempts: failResult.remainingAttempts,
        error: 'Incorrect passcode. Please try again.',
      });
      return;
    }

    // Password is valid - reset failed attempts
    resetFailedAttempts(clientInfo.ipAddress);

    // Auto-upgrade legacy hash to modern scrypt hash seamlessly
    if (!storedHash.startsWith('scrypt:')) {
      settings.masterPasswordHash = hashPassword(trimmed);
      await settings.save();
    }

    // Record successful login attempt
    await LoginAttempt.create({
      ipAddress: clientInfo.ipAddress,
      userAgent: req.headers['user-agent'] || '',
      browser: clientInfo.browser,
      os: clientInfo.os,
      device: clientInfo.device,
      success: true,
      failureReason: null,
    }).catch(() => {});

    // Create session in database
    const sessionToken = generateSessionToken();
    const parsedTimeout = typeof timeoutMs === 'number' && timeoutMs >= 0 ? timeoutMs : 900000;
    const parsedMaxSession = typeof maxSessionMs === 'number' && maxSessionMs > 0 ? maxSessionMs : (parsedTimeout > 0 ? parsedTimeout * 3 : 0);
    const expiresAt = parsedMaxSession > 0 ? new Date(Date.now() + parsedMaxSession) : (parsedTimeout > 0 ? new Date(Date.now() + parsedTimeout) : null);

    const newSession = await AuthSession.create({
      sessionToken,
      ipAddress: clientInfo.ipAddress,
      userAgent: req.headers['user-agent'] || '',
      browser: clientInfo.browser,
      os: clientInfo.os,
      device: clientInfo.device,
      loginAt: new Date(),
      lastActiveAt: new Date(),
      expiresAt,
      status: 'active',
      logoutReason: null,
    });

    // Set secure HTTP-only cookie on response for maximum browser security
    const cookieMaxAge = parsedMaxSession > 0 ? parsedMaxSession : (parsedTimeout > 0 ? parsedTimeout : 24 * 60 * 60 * 1000);
    res.cookie('tasksmanager_session_token', newSession.sessionToken, getSessionCookieOptions(cookieMaxAge));

    const passwordUpdatedAt = settings.passwordUpdatedAt ? new Date(settings.passwordUpdatedAt).toISOString() : null;

    res.json({
      valid: true,
      sessionToken: newSession.sessionToken,
      passwordUpdatedAt,
      loginAt: newSession.loginAt.toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function logoutSession(req: Request, res: Response, next: NextFunction) {
  try {
    const sessionToken = extractRequestToken(req);
    const reason = (req.body?.reason || 'Manual Logout') as string;

    if (sessionToken) {
      invalidateSessionCache(sessionToken);
      const session = await AuthSession.findOne({ sessionToken });
      if (session) {
        const now = new Date();
        const durationSeconds = Math.max(0, Math.round((now.getTime() - session.loginAt.getTime()) / 1000));
        session.status = 'logged_out';
        session.logoutAt = now;
        session.logoutReason = reason;
        session.durationSeconds = durationSeconds;
        await session.save();
      }
    }

    res.clearCookie('tasksmanager_session_token', getSessionCookieOptions());

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

export async function sessionTimeout(req: Request, res: Response, next: NextFunction) {
  try {
    const sessionToken = extractRequestToken(req);

    if (sessionToken) {
      invalidateSessionCache(sessionToken);
      const session = await AuthSession.findOne({ sessionToken });
      if (session && session.status === 'active') {
        const now = new Date();
        const durationSeconds = Math.max(0, Math.round((now.getTime() - session.loginAt.getTime()) / 1000));
        session.status = 'expired';
        session.logoutAt = now;
        session.logoutReason = 'Session Timeout';
        session.durationSeconds = durationSeconds;
        await session.save();
      }
    }

    res.clearCookie('tasksmanager_session_token', getSessionCookieOptions());

    res.json({ success: true, message: 'Session expired recorded' });
  } catch (err) {
    next(err);
  }
}

export async function recordSessionActivity(req: Request, res: Response, next: NextFunction) {
  try {
    const sessionToken = extractRequestToken(req);

    if (sessionToken) {
      await AuthSession.updateOne(
        { sessionToken, status: 'active' },
        { $set: { lastActiveAt: new Date() } }
      ).catch(() => {});
    }

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function updateMasterPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { newPassword } = req.body;
    if (typeof newPassword !== 'string' || newPassword.trim().length < 4) {
      res.status(400).json({ error: 'Password must be at least 4 characters long' });
      return;
    }

    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    const newHash = hashPassword(newPassword.trim());
    const updatedAt = new Date();
    settings.masterPasswordHash = newHash;
    settings.passwordUpdatedAt = updatedAt;
    await settings.save();

    invalidatePasswordCache(updatedAt);
    invalidateSessionCache();

    // Invalidate all existing active sessions immediately
    await AuthSession.updateMany(
      { status: 'active' },
      {
        $set: {
          status: 'revoked',
          logoutAt: updatedAt,
          logoutReason: 'Password Changed',
        },
      }
    ).catch(() => {});

    res.clearCookie('tasksmanager_session_token', getSessionCookieOptions());

    res.json({
      success: true,
      message: 'Master application password updated successfully',
      passwordUpdatedAt: updatedAt.toISOString(),
    });
  } catch (err) {
    next(err);
  }
}
